import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CommodityGroupText extends ExtendedModel {
	}

	CommodityGroupText.init({
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'commodity_group_text',
		modelName: 'commodityGroupText',
		sequelize
	});

	return CommodityGroupText;
}