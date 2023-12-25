import ExtendedModel from '../../db/model';

export default function (sequelize, DataTypes) {
	class TariffPacket extends ExtendedModel {
	}

	TariffPacket.init({
		packet_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING(255),
		},

		discount: {
			type: DataTypes.DECIMAL(20, 2),
		},

		months: {
			type: DataTypes.INTEGER,
		},

		sort: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'tariff_packet',
		modelName: 'tariffPacket',
		sequelize
	});

	return TariffPacket;
}