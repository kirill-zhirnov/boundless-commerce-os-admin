import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ShippingTariffText extends ExtendedModel {
	}

	ShippingTariffText.init({
		tariff_id: {
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
		tableName: 'shipping_tariff_text',
		modelName: 'shippingTariffText',
		sequelize
	});

	return ShippingTariffText;
}