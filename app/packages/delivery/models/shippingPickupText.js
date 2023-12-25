import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ShippingPickupText extends ExtendedModel {
	}

	ShippingPickupText.init({
		point_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT
		},

		address: {
			type: DataTypes.TEXT
		},

		phone: {
			type: DataTypes.STRING(100)
		},

		work_schedule: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'shipping_pickup_text',
		modelName: 'shippingPickupText',
		sequelize
	});

	return ShippingPickupText;
}