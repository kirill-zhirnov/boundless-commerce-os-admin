import {BuildOptions} from 'sequelize/types';
import {IPersonRoleRel} from '../../../@types/person';
import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PersonRoleRel extends ExtendedModel {
	}

	PersonRoleRel.init({
		person_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		role_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		}
	}, {
		tableName: 'person_role_rel',
		modelName: 'personRoleRel',
		sequelize
	});

	return PersonRoleRel;
}

export interface IPersonRoleRelModel extends ExtendedModel, IPersonRoleRel {
}

export type IPersonRoleRelModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonRoleRelModel;
}