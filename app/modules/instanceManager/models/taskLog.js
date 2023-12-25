import ExtendedModel from '../../db/model';

export default function (sequelize, DataTypes) {
	class TaskLog extends ExtendedModel {
	}

	TaskLog.init({
		task_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		stream_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		started_at: {
			type: DataTypes.DATE
		},

		completed_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'task_log',
		modelName: 'taskLog',
		sequelize
	});

	return TaskLog;
}