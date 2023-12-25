import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliveryText extends ExtendedModel {
	}

	DeliveryText.init({
		delivery_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		description: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'delivery_text',
		modelName: 'deliveryText',
		sequelize
	});

	return DeliveryText;
}