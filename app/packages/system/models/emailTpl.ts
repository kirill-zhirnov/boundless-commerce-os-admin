import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {IEmailTpl} from '../../../@types/system';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class EmailTpl extends ExtendedModel {
	}

	EmailTpl.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(255)
		},
		alias: {
			type: DataTypes.STRING(255)
		},
		subject: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		template: {
			type: DataTypes.TEXT
		},
		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'email_tpl',
		modelName: 'emailTpl',
		sequelize
	});

	return EmailTpl;
}

export interface IEmailTplModel extends ExtendedModel, IEmailTpl {
}

export type IEmailTplModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): IEmailTplModel;
}