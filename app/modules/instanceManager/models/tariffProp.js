import ExtendedModel from '../../db/model';

export default function (sequelize, DataTypes) {
	class TariffProp extends ExtendedModel {
	}

	TariffProp.init({
		tariff_id: {
			primaryKey: true,
			autoIncrement: true,
			type: DataTypes.INTEGER
		},

		max_client_amount: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		next_tariff_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'tariff_prop',
		modelName: 'tariffProp',
		sequelize
	});

	return TariffProp;
}