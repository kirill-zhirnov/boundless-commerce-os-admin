import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Site extends ExtendedModel {
	}

	Site.init({
		site_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		host: {
			type: DataTypes.STRING
		},

		settings: {
			type: DataTypes.JSONB
		},

		aliases: {
			type: DataTypes.JSONB
		},

		system_host: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'site',
		modelName: 'site',
		sequelize
	});

	return Site;
}