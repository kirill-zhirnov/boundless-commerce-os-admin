import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliveryCountry extends ExtendedModel {
	}

	DeliveryCountry.init({
		delivery_country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		delivery_site_id: {
			type: DataTypes.INTEGER
		},

		country_id: {
			type: DataTypes.INTEGER
		},

		all_city: {
			type: DataTypes.BOOLEAN
		},

		rate: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		}
	}, {
		tableName: 'delivery_country',
		modelName: 'deliveryCountry',
		sequelize
	});

	return DeliveryCountry;
}