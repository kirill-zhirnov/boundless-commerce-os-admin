import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class NotificationHistory extends ExtendedModel {
	}

	NotificationHistory.init({
		notification_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		recipient: {
			type: DataTypes.STRING(500)
		},
		type: {
			type: DataTypes.ENUM('orderReviewRequest')
		},
		essence_id: {
			type: DataTypes.INTEGER,
		},
		text: {
			type: DataTypes.TEXT
		},
		sent_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'notification_history',
		modelName: 'notificationHistory',
		sequelize
	});

	return NotificationHistory;
}