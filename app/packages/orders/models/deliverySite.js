import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class DeliverySite extends ExtendedModel {
	}

	DeliverySite.init({
		delivery_site_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		delivery_id: {
			type: DataTypes.INTEGER
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'delivery_site',
		modelName: 'deliverySite',
		sequelize
	});

	return DeliverySite;
}