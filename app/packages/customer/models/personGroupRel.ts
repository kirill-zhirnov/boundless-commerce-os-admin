import ExtendedModel from '../../../modules/db/model';
import {IPersonGroupRel} from '../../../@types/person';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class PersonGroupRel extends ExtendedModel {
	}

	PersonGroupRel.init({
		person_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
	}, {
		tableName: 'person_group_rel',
		modelName: 'personGroupRel',
		sequelize
	});
}

export interface IPersonGroupRelModel extends ExtendedModel, IPersonGroupRel {}

export type IIPersonGroupRelModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonGroupRelModel;
}