import ExtendedModel from '../../../modules/db/model';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import childProcess from 'child_process';
import path from 'path';
import pathAlias from 'path-alias';
import {BuildOptions} from 'sequelize/types';
import {IProductImport, TProductImportAction} from '../../../@types/productImport';
import JedExtended from '../../../modules/i18n/jed.client';
import {IItemPriceModelStatic} from '../../orders/models/itemPrice';

export default function (sequelize, DataTypes) {
	class ProductImport extends ExtendedModel {
		static getDelimetersOptions(i18n: JedExtended): IDelimeterOptions {
			return {
				delimiter: [
					[',', i18n.__(', - comma')],
					[';', i18n.__('; - semicolon')],
					['tab', i18n.__('Tab character')],
					['space', i18n.__('Space')]
				],

				quote: [
					['\'', i18n.__('\' - single quote')],
					['"', i18n.__('" - double quote')],
				],

				escape: [
					['"', i18n.__('" - double quote')]
				],

				encoding: [
					['cp1251', 'Windows-1251'],
					['koi8-r', 'KOI8-R'],
					['utf8', 'UTF-8'],
					['utf-16le', 'UTF-16LE'],
					['MacCyrillic', 'MacCyrillic'],
				]
			};
		}

		static async getYmlSettings() {
			const row = await (this.sequelize.model('price') as IItemPriceModelStatic).findOne({
				where: {
					alias: 'selling_price'
				}
			});

			let settings = null;
			if (row) {
				settings = {priceKey: `price_${row.price_id}`};
			}

			return settings;
		}

		static async deleteImportSchedule(instanceId: number, importId: number) {
			await this.safeDelete({
				where: {
					import_id: importId
				}
			});

			//@ts-ignore
			await wrapperRegistry.getDb().model('task').safeDelete({
				where: {
					local_id: importId,
					instance_id: instanceId
				}
			});
		}

		static async restoreImportSchedule(instanceId: number, importId: number) {
			await this.recover({
				where: {
					import_id: importId
				}
			});

			//@ts-ignore
			await wrapperRegistry.getDb().model('task').recover({
				where: {
					local_id: importId,
					instance_id: instanceId
				}
			});
		}

		static startImport(instanceId: number, importId: number, action: TProductImportAction = TProductImportAction.run) {
			const importCmd = wrapperRegistry.getConfig().instanceManager.import;

			let args;
			switch (action) {
				case TProductImportAction.run:
					args = importCmd.productRunArgs;
					break;
				case TProductImportAction.download:
					args = importCmd.productFileDownloadArgs;
					break;
				default:
					throw new Error(`Unknown action ${action}`);
			}

			const ext = path.extname(args[0]);
			let cmd = 'node';
			if (ext == '.ts') {
				cmd = pathAlias.resolve('node_modules/.bin/ts-node');
			}

			args = args.concat([
				`--instanceId=${instanceId}`,
				`--importId=${importId}`
			]);

			const spawn = childProcess.spawn(cmd, args, {
				detached: true,
				stdio: 'ignore'
			});

			spawn.unref();
		}
	}

	ProductImport.init({
		import_id: {
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

		person_id: {
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.ENUM('csv', 'excel', 'yml')
		},

		run: {
			type: DataTypes.ENUM('once', 'cron')
		},

		source_type: {
			type: DataTypes.ENUM('file', 'url')
		},

		file_name: {
			type: DataTypes.TEXT
		},

		file_path: {
			type: DataTypes.STRING(255)
		},

		cloud_path: {
			type: DataTypes.STRING(255)
		},

		url: {
			type: DataTypes.STRING(255)
		},

		settings: {
			type: DataTypes.JSON
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'product_import',
		deletedAt: 'deleted_at',
		modelName: 'productImport',
		sequelize
	});

	return ProductImport;
}

export interface IProductImportModel extends ExtendedModel, IProductImport {
}

export type IProductImportModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IProductImportModel;

	getDelimetersOptions: (i18n: JedExtended) => IDelimeterOptions
	getYmlSettings: () => {priceKey: string}|null;
	deleteImportSchedule: (instanceId: number, importId: number) => void;
	restoreImportSchedule: (instanceId: number, importId: number) => void;
	startImport: (instanceId: number, importId: number, action: TProductImportAction) => void;
}

export interface IDelimeterOptions {
	delimiter: string[][];
	quote: string[][];
	escape: string[][];
	encoding: string[][];
}