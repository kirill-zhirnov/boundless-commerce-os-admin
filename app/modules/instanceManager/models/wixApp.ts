import ExtendedModel from '../../db/model';
import {IWixApp} from '../../../@types/instances';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class WixApp extends ExtendedModel {
	}

	WixApp.init({
		wix_app_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		wix_instance_id: {
			type: DataTypes.STRING(50),
		},
		status: {
			type: DataTypes.STRING(30)
		},
		instance_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		refresh_token: {
			type: DataTypes.STRING(500),
			allowNull: true
		},
		data: {
			type: DataTypes.JSONB
		},
		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'wix_app',
		modelName: 'wixApp',
		sequelize
	});
}

export interface IWixAppModel extends ExtendedModel, IWixApp {}

export type IWixAppModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IWixAppModel;
}