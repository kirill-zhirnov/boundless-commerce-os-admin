import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class SmsLog extends ExtendedModel {
	}

	SmsLog.init({
		log_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		service_id: {
			type: DataTypes.INTEGER
		},

		person_id: {
			type: DataTypes.INTEGER
		},

		event_id: {
			type: DataTypes.INTEGER
		},

		recipient: {
			type: DataTypes.TEXT
		},

		message: {
			type: DataTypes.TEXT
		},

		status: {
			type: DataTypes.ENUM('success', 'error')
		},

		error: {
			type: DataTypes.JSONB
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'sms_log',
		modelName: 'smsLog',
		sequelize
	});

	return SmsLog;
}