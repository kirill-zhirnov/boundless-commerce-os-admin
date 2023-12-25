import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CrossSellCategory extends ExtendedModel {
		static async findOptions(keyField = 'category_id') {
			let rows = await this.findAll({
				order: [['title', 'asc']]
			});

			let out = [];
			for (let row of rows) {
				//@ts-ignore
				out.push([row[keyField], row.title]);
			}

			return out;
		}
	}

	CrossSellCategory.init({
		category_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.STRING(20)
		},

		title: {
			type: DataTypes.STRING(255)
		},
	}, {
		tableName: 'cross_sell_category',
		modelName: 'crossSellCategory',
		sequelize
	});

	return CrossSellCategory;
}