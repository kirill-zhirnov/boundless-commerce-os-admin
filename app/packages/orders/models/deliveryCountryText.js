import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliveryCountryText extends ExtendedModel {
	}

	DeliveryCountryText.init({
		delivery_country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		delivery_time: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'delivery_country_text',
		modelName: 'deliveryCountryText',
		sequelize
	});

	return DeliveryCountryText;
}