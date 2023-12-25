import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliveryCityText extends ExtendedModel {
	}

	DeliveryCityText.init({
		delivery_city_id: {
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
		tableName: 'delivery_city_text',
		modelName: 'deliveryCityText',
		sequelize
	});

	return DeliveryCityText;
}