import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ShippingOptionText extends ExtendedModel {
	}

	ShippingOptionText.init({
		option_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'shipping_option_text',
		modelName: 'shippingOptionText',
		sequelize
	});

	return ShippingOptionText;
}