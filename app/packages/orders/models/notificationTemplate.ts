import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {INotificationTemplate} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class NotificationTemplate extends ExtendedModel {
	}

	NotificationTemplate.init({
		template_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		event_type: {
			type: DataTypes.ENUM('created', 'updated'),
			allowNull: true
		},
		status_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		subject: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		template: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'notification_template',
		modelName: 'notificationTemplate',
		sequelize
	});

	return NotificationTemplate;
}

export interface INotificationTemplateModel extends ExtendedModel, INotificationTemplate {
}

export type INotificationTemplateModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): INotificationTemplateModel;
}