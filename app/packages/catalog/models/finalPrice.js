import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class FinalPrice extends ExtendedModel {
	}

	FinalPrice.init({
		point_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		currency_id: {
			type: DataTypes.INTEGER
		},

		value: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		min: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		max: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		is_auto_generated: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'final_price',
		modelName: 'finalPrice',
		sequelize
	});

	return FinalPrice;
}