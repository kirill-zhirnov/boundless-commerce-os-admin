import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class SmsTemplate extends ExtendedModel {
	}

	SmsTemplate.init({
		template_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		event_id: {
			type: DataTypes.INTEGER
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		template: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'sms_template',
		modelName: 'smsTemplate',
		sequelize
	});

	return SmsTemplate;
}