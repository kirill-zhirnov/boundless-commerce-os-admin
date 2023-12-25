import ExtendedModel from '../../../modules/db/model';
import fs from 'fs';
import path from 'path';
import * as randomPath from '../../../modules/randomPath/index';
import md5 from 'md5';
import InstanceS3Storage from '../../../modules/s3Storage/instance';
import {promisify} from 'util';
import {BuildOptions, Transaction} from 'sequelize/types';
import {IImage, IImageData, TImageUsed} from '../../../@types/image';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import * as img from '../../cms/modules/img';
import {IConsumedSpaceModelStatic} from '../../system/models/consumedSpace';

const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
// const copyFile = promisify(fs.copyFile);

export default function (sequelize, DataTypes) {
	class Image extends ExtendedModel {
		//			dataPath = instanceRegistry.getDataPath()
		static async copy(imageId, dataPath, instanceRegistry = null) {
			const folderName = 'images';
			const imgsPath = `${dataPath}/${folderName}`;
			const s3Storage = new InstanceS3Storage(instanceRegistry);

			const row = await this.findException({
				where: {
					image_id: imageId
				},
				limit: 1
			}) as IImageModel;

			const newLocalPath = randomPath.getByFileName(imgsPath, path.basename(row.path));
			await s3Storage.copy(row.path, `${folderName}/${newLocalPath}`);

			return await this.sequelize.sql(`
				insert into image
					(site_id, lang_id, name, size, path, width, height, used_in, mime_type)
				select
					site_id,
					lang_id,
					name,
					size,
					:path,
					width,
					height,
					used_in,
					mime_type
				from
					image
				where
					image_id = :id
				returning *
			`, {
				id: imageId,
				path: `${folderName}/${newLocalPath}`
			});
		}

		static async createImage(siteId, langId, absolutePath, dataPath, usedIn, trx = null) {
			if (usedIn == null) {usedIn = [];}

			const _stat = await stat(absolutePath);

			const {height, width} = await img.identify(absolutePath);

			let usedInDbVal = 'null';
			if (usedIn.length > 0) {
				usedInDbVal = `'{"${usedIn.join('","')}"}'`;
			}

			const row = await this.sequelize.sql(`
				insert into image
					(name, size, path, used_in, mime_type, site_id, lang_id, width, height)
				values
					(:name, :size, :path, ${usedInDbVal}, :mimeType, :siteId, :langId, :width, :height)
				RETURNING *
			`, {
				name: path.basename(absolutePath),
				size: _stat.size,
				path: absolutePath.replace(`${dataPath}/`, ''),
				mimeType: null,
				siteId,
				langId,
				width,
				height
			}, {
				transaction: trx
			});

			return row;
		}

		static async createAndUploadImage(instanceRegistry, siteId, langId, absolutePath, usedIn, mimeType = null): Promise<IImageData> {
			const s3Storage = new InstanceS3Storage(instanceRegistry);
			usedIn = Array.isArray(usedIn) && usedIn.length > 0 ? usedIn : null;

			const imageData = {
				imageId: null
			};
			try {
				const {height, width} = await img.identify(absolutePath);
				const {size} = await stat(absolutePath);
				const extension = path.extname(absolutePath).substr(1);
				const {path: cloudPath, image_id} = await this.makeUniquePath('images', extension);

				Object.assign(imageData, {
					height,
					width,
					imageId: image_id,
					size,
					cloudPath
				});
				await s3Storage.upload(fs.createReadStream(absolutePath), cloudPath, {contentType: mimeType});

				await this.update({
					site_id: siteId,
					lang_id: langId,
					name: path.basename(absolutePath),
					size,
					mime_type: mimeType,
					width,
					height,
					used_in: usedIn
				}, {
					where: {
						image_id
					}
				});

				await (this.sequelize.model('consumedSpace') as IConsumedSpaceModelStatic).increaseConsumedOnS3(size);
			} catch (e) {
				if (imageData.imageId) {
					this.destroy({
						where: {
							image_id: imageData.imageId
						}
					});
				}

				throw e;
			} finally {
				await unlink(absolutePath);
			}

			return imageData;
		}

		//			completely remove image from disk and database:
		static async removeImage(imageId, instanceRegistry) {
			const dataPath = instanceRegistry.getDataPath();
			const row = await this.findOne({
				where: {
					image_id: imageId
				}
			}) as IImageModel;

			if (row) {
				try {
					const s3Storage = new InstanceS3Storage(instanceRegistry);
					await s3Storage.deleteImgWithThumbs(row.path);
				} catch (e) {
					console.error('image.deleteImgWithThumbs:', e);
				}

				const fullPath = `${dataPath}/${row.path}`;
				if (fs.existsSync(fullPath)) {
					await unlink(fullPath);
				}
				await this.destroy({
					where: {
						//@ts-ignore
						image_id: row.image_id
					}
				});
			}
		}

		static async bulkImageRm(images, instanceRegistry, removeFilesFromS3 = true) {
			const imageIds = [];

			if (removeFilesFromS3) {
				const s3Storage = new InstanceS3Storage(instanceRegistry);
				for (const image of images) {
					if (!image.image_id || !image.path) continue;

					imageIds.push(image.image_id);
					await s3Storage.deleteImgWithThumbs(image.path);
				}
			}

			await this.destroy({
				where: {
					image_id: imageIds
				}
			});
		}

		static async makeUniquePath(folder, extension) {
			const randomStr = md5(`${folder}-${Math.random()}-${extension}`);
			const filePath = `${folder}/${randomStr}.${extension}`;

			const [row] = await this.sequelize.sql(`
				insert into image (path)
				values (:filePath)
				on conflict do nothing
				returning *
			`, {filePath});

			if (row)
				return row;

			return this.makeUniquePath(folder, extension);
		}
	}

	Image.init({
		image_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		name: {
			type: DataTypes.TEXT
		},

		size: {
			type: DataTypes.INTEGER
		},

		path: {
			type: DataTypes.STRING(255)
		},

		width: {
			type: DataTypes.INTEGER
		},

		height: {
			type: DataTypes.INTEGER
		},

		used_in: {
			type: DataTypes.ARRAY(DataTypes.ENUM(
				'page',
				'category',
				'product',
				'manufacturer',
				'carousel',
				'instagram',
				'background',
				'blog',
				'form'
			))
		},

		mime_type: {
			type: DataTypes.STRING(255)
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'image',
		deletedAt: 'deleted_at',
		modelName: 'image',
		sequelize
	});

	return Image;
}


export interface IImageModel extends ExtendedModel, IImage {
}

export type IImageModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IImageModel;

	copy: (imageId: number, dataPath: string, instanceRegistry?: IInstanceRegistry | null) => Promise<IImage>
	createAndUploadImage: (instanceRegistry: IInstanceRegistry, siteId: number, langId: number, absolutePath: string, usedIn: TImageUsed[], mimeType?: string | null) => Promise<IImageData>
	createImage: (siteId: number, langId: number, absolutePath: string, dataPathstring: string, usedIn: TImageUsed[] | TImageUsed, trx?: Transaction | null) => Promise<IImage>
	removeImage: (imageId: number, instanceRegistry: IInstanceRegistry) => Promise<void>
	makeUniquePath: (folder: string, extension: string) => Promise<IImage>
}