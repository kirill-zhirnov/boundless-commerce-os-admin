import ExtendedModel from '../../db/model';

export default function (sequelize, DataTypes) {
	class MailLog extends ExtendedModel {
	}

	MailLog.init({
		log_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		instance_id: {
			type: DataTypes.INTEGER
		},

		mail_alias: {
			type: DataTypes.STRING(30)
		},

		sender: {
			type: DataTypes.STRING(20)
		},

		ts: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'mail_log',
		modelName: 'mailLog',
		sequelize
	});

	return MailLog;
}
