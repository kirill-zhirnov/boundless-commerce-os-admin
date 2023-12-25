import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class AuthTask extends ExtendedModel {
	}

	AuthTask.init({
		task_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		resource_id: {
			type: DataTypes.INTEGER
		},

		alias: {
			type: DataTypes.STRING
		},

		title: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'auth_task',
		modelName: 'authTask',
		sequelize
	});

	return AuthTask;
}