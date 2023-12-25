import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPersonProfile} from '../../../@types/person';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PersonProfile extends ExtendedModel {
	}

	PersonProfile.init({
		person_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		first_name: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		last_name: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		patronymic: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		group_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		phone: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		receive_marketing_info: {
			type: DataTypes.BOOLEAN,
		},

		comment: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		custom_attrs: {
			type: DataTypes.JSONB,
			allowNull: true
		},
	}, {
		tableName: 'person_profile',
		modelName: 'personProfile',
		sequelize
	});

	return PersonProfile;
}

export interface IPersonProfileModel extends ExtendedModel, IPersonProfile {
}

export type IPersonProfileModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonProfileModel;
}