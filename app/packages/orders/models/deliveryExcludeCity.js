import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliveryExcludeCity extends ExtendedModel {
	}

	DeliveryExcludeCity.init({
		delivery_site_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		city_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		}
	}, {
		tableName: 'delivery_exclude_city',
		modelName: 'deliveryExcludeCity',
		sequelize
	});

	return DeliveryExcludeCity;
}