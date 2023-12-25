import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class AuthResource extends ExtendedModel {
	}

	AuthResource.init({
		resource_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		parent_id: {
			type: DataTypes.INTEGER
		},

		alias: {
			type: DataTypes.STRING
		},

		title: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'auth_resource',
		modelName: 'authResource',
		sequelize
	});

	return AuthResource;
}