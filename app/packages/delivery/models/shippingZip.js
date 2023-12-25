import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ShippingZip extends ExtendedModel {
	}

	ShippingZip.init({
		shipping_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		zip_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		courier: {
			type: DataTypes.BOOLEAN,
		}
	}, {
		tableName: 'shipping_zip',
		modelName: 'shippingZip',
		sequelize
	});

	return ShippingZip;
}