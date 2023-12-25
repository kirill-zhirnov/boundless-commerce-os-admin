import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {BuildOptions} from 'sequelize';
import {IPersonAttrs} from '../../../@types/person';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PersonAttrs extends ExtendedModel {
	}

	PersonAttrs.init({
		attr_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING(255),
		},

		key: {
			type: DataTypes.STRING(20),
		},

		type: {
			type: DataTypes.ENUM('text', 'text_area', 'checkbox', 'dropdown')
		},

		options: {
			type: DataTypes.JSON,
			allowNull: true
		},

		hint: {
			type: DataTypes.STRING(1000),
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER,
		}
	}, {
		tableName: 'person_attrs',
		modelName: 'personAttrs',
		sequelize
	});
}

export interface IPersonAttrsModel extends ExtendedModel, IPersonAttrs {
}

export type IPersonAttrsModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonAttrsModel;
}