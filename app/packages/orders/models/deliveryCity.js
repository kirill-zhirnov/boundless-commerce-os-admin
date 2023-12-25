import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliveryCity extends ExtendedModel {
	}

	DeliveryCity.init({
		delivery_city_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		delivery_site_id: {
			type: DataTypes.INTEGER
		},

		city_id: {
			type: DataTypes.INTEGER
		},

		rate: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		}
	}, {
		tableName: 'delivery_city',
		modelName: 'deliveryCity',
		sequelize
	});

	return DeliveryCity;
}