import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PriceText extends ExtendedModel {
	}

	PriceText.init({
		price_id: {
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
		tableName: 'price_text',
		modelName: 'priceText',
		sequelize
	});

	return PriceText;
}