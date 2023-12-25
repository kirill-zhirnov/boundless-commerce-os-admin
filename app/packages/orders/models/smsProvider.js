import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class SmsProvider extends ExtendedModel {
	}

	SmsProvider.init({
		provider_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		alias: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'sms_provider',
		modelName: 'smsProvider',
		sequelize
	});

	return SmsProvider;
}