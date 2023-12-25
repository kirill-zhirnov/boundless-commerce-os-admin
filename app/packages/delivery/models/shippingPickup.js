import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ShippingPickup extends ExtendedModel {
	}

	ShippingPickup.init({
		point_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		shipping_id: {
			type: DataTypes.INTEGER
		},

		city_id: {
			type: DataTypes.INTEGER
		},

		local_id: {
			type: DataTypes.STRING(255)
		},

		coordinate: {
			type: DataTypes.GEOMETRY
		},

		possibility_to_pay_for_order: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'shipping_pickup',
		modelName: 'shippingPickup',
		sequelize
	});

	return ShippingPickup;
}