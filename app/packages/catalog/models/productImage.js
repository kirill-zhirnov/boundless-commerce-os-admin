import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import * as thumbnailUrl from '../../cms/modules/thumbnail/url';
import urlLib from 'url';

export default function (sequelize, DataTypes) {
	class ProductImage extends ExtendedModel {
		static async saveSort(productId, sort) {
			if (!Array.isArray(sort)) {
				sort = [];
			}

			//				is_default will be set by function product_check_default_img
			//				which called after saving sort.
			//				first image - will be image by default
			await this.sequelize.sql(`
				update
					product_image
				set
					is_default = false
				where
					product_id = :product
			`, {
				product: productId
			});

			for (let i = 0; i < sort.length; i++) {
				const productImageId = sort[i];
				await this.update({
					sort: i * 10
				}, {
					where: {
						product_image_id: productImageId,
						product_id: productId
					}
				});
			}

			await this.sequelize.sql(`
				select product_check_default_img(:product)
			`, {
				product: productId
			});
		}

		static async loadImages(instanceRegistry, productId, langId) {
			const imgProportion = await instanceRegistry.getSettings().get('system', 'imgProportion');

			const rows = await this.sequelize.sql(`
				select
					image.*,
					product_image.*,
					product_image_text.description,
					product_image_text.alt,
					image_tag.tags
				from
					product_image
				inner join image using(image_id)
				inner join product_image_text using(product_image_id)
				left join (
					select
						json_agg(image_tag.* order by image_tag.title) as tags,
						product_image_id
					from image_tag_rel
					left join image_tag using (image_tag_id)
					group by product_image_id
				) as image_tag using (product_image_id)
				where
					product_id = :product
					and deleted_at is null
					and product_image_text.lang_id = :lang
				order by
					is_default desc,
					sort asc
			`, {
				product: productId,
				lang: langId
			});


			const out = [];
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				out.push(this.prepareImgRow(instanceRegistry, imgProportion, row));
			}

			return out;
		}

		static prepareImgRow(instanceRegistry, imgProportion, row) {
			row.thumb = {
				xs: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 'xs', imgProportion),
				s: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 's', imgProportion),
				m: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 'm', imgProportion),
				l: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 'l', imgProportion)
			};

			row.scaled = {
				xs: thumbnailUrl.getAttrs(instanceRegistry, row, 'scaled', 'xs'),
				s: thumbnailUrl.getAttrs(instanceRegistry, row, 'scaled', 's'),
				m: thumbnailUrl.getAttrs(instanceRegistry, row, 'scaled', 'm'),
				l: thumbnailUrl.getAttrs(instanceRegistry, row, 'scaled', 'l'),
				lightbox: thumbnailUrl.getAttrs(instanceRegistry, row, 'scaled', 'lightbox')
			};

			//				images for opengraph or schama.org- always should be square to avoit cut in google search snippets
			row.squareThumb = {
				xs: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 'xs', 'scf'),
				s: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 's', 'scf'),
				m: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 'm', 'scf'),
				l: thumbnailUrl.getAttrs(instanceRegistry, row, 'thumb', 'l', 'scf')
			};

			row = _.omit(row, [
				'product_id',
				'sort',
				'site_id',
				'lang_id',
				'used_in',
				'deleted_at',
				'source_url'
			]);

			return row;
		}

		static prepareSourceUrl(sourceUrl) {
			sourceUrl = String(sourceUrl).toLowerCase();

			const parsed = urlLib.parse(sourceUrl);
			return sourceUrl.substr(parsed.protocol.length);
		}

		static async removeProductImages(productIds, instanceRegistry) {
			productIds = Array.isArray(productIds) ? productIds : [productIds];

			const images = await this.findAll({
				where: {
					product_id: productIds
				}
			});

			for (const image of images) {
				//@ts-ignore
				await this.sequelize.model('image').removeImage(image.image_id, instanceRegistry);
			}
		}

		static async removeImage(productImageId, instanceRegistry) {
			const row = await this.findOne({
				where: {
					product_image_id: productImageId
				}
			});

			//					product_image will be deleted by foreign key,
			//					default image will be set by trigger:
			if (row) {
				//@ts-ignore
				await this.sequelize.model('image').removeImage(row.image_id, instanceRegistry);
			}
		}
	}

	ProductImage.init({
		product_image_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		image_id: {
			type: DataTypes.INTEGER
		},

		is_default: {
			type: DataTypes.BOOLEAN
		},

		source_url: {
			type: DataTypes.TEXT
		},

		sort: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'product_image',
		modelName: 'productImage',
		sequelize
	});

	return ProductImage;
}