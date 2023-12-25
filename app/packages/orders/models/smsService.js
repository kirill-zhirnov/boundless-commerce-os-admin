import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class SmsService extends ExtendedModel {
	}

	SmsService.init({
		service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		provider_id: {
			type: DataTypes.INTEGER
		},

		settings: {
			type: DataTypes.JSONB
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'sms_service',
		deletedAt: 'deleted_at',
		modelName: 'smsService',
		sequelize
	});

	return SmsService;
}