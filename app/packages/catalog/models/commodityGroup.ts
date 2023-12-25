import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';
import {ICommodityGroup} from '../../../@types/catalog';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class CommodityGroup extends ExtendedModel {
		static getTypeOptions(i18n, out = []) {
			return out.concat([
				['digital', i18n.__('Digital')],
				['material', i18n.__('Material')]
			]);
		}

		static async fetchOptions(langId: number, out = []) {
			const rows = await this.findAll({
				include: [{
					model: sequelize.model('commodityGroupText'),
					where: {
						lang_id: langId
					}
				}],
				where: {
					deleted_at: null
				},
				order: [
					[sequelize.model('commodityGroupText'), 'title', 'ASC']
				]
			});

			for (let row of rows) {
				//@ts-ignore
				row = row.toJSON();

				//@ts-ignore
				out.push([row.group_id, row.commodityGroupTexts[0].title]);
			}

			return out;
		}

		static async createByTitle(title, langId) {
			const row = await this.sequelize.model('commodityGroup').build().save();

			await this.sequelize.model('commodityGroupText').update({
				title
			}, {
				where: {
					//@ts-ignore
					group_id: row.group_id,
					lang_id: langId
				}
			});

			return row;
		}

		static async findOrCreateByTitle(title, langId) {
			const row = await this.sequelize.model('commodityGroupText').findOne({
				include: [
					{
						required: true,
						model: this.sequelize.model('commodityGroup')
					}
				],

				where: {
					lang_id: langId,
					title
				}
			});
			if (row) {
				//@ts-ignore
				return row.commodityGroup;
			} else {
				return await this.createByTitle(title, langId);
			}
		}

		static async safeDelete(options) {
			const attrs = {
				deleted_at: this.sequelize.fn('NOW')
			};

			await this.update(attrs, options);
		}

		static async recover(options) {
			const attrs = {
				deleted_at: null
			};

			await this.update(attrs, options);
		}


		static async checkDefaultExists() {
			const row = await this.findOne({
				where: {
					is_default: true,
					deleted_at: null
				}
			});

			if (!row) {
				await this.sequelize.sql(`
					update
						commodity_group
						set
							is_default = true
						where
							group_id in (
								select
									group_id
								from
									commodity_group
								where
									deleted_at is null
								limit 1
							)
				`);
			}
		}

		static async getDefaultCommodityGroup(langId, title) {
			const row = await this.findOne({
				where: {
					is_default: true
				}
			});

			if (row) {
				return row.toJSON();
			}

			const [newGroup] = await this.sequelize.sql(`
				insert into commodity_group
					(type, unit_id, yml_export, is_default, not_track_inventory)
				select
					'material',
					unit_id,
					true,
					true,
					true
				from
					unit_measurement
				limit 1
					returning *
			`);

			if (newGroup) {
				await this.sequelize.model('commodityGroupText').update({
					title
				}, {
					where: {
						//@ts-ignore
						group_id: newGroup.group_id,
						lang_id: langId
					}
				});
			}

			return newGroup;
		}

		static findOrCreateDefault(langId, i18n) {
			return this.getDefaultCommodityGroup(langId, i18n.__('Default Product Type'));
		}
	}

	CommodityGroup.init({
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		type: {
			type: DataTypes.ENUM('digital', 'material'),
			allowNull: true
		},

		physical_products: {
			type: DataTypes.BOOLEAN
		},

		unit_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		not_track_inventory: {
			type: DataTypes.BOOLEAN
		},

		yml_export: {
			type: DataTypes.BOOLEAN
		},

		vat: {
			type: DataTypes.STRING(20)
		},

		is_default: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'commodity_group',
		deletedAt: 'deleted_at',
		modelName: 'commodityGroup',
		sequelize
	});

	return CommodityGroup;
}

export interface ICommodityGroupModel extends ExtendedModel, ICommodityGroup {
}

export type ICommodityGroupModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICommodityGroupModel;

	fetchOptions: (langId: number, out?: any[]) => Promise<string[][]>;
}