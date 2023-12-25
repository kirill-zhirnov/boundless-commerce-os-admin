import {BuildOptions} from 'sequelize/types';
import {IPersonAuth} from '../../../@types/person';
import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PersonAuth extends ExtendedModel {
		static async updatePass(personId, pass, options = {}) {
			await this.sequelize.sql(`
				update
					person_auth
				set
					pass = crypt(:pass, gen_salt('bf'))
				where
					person_id = :id
			`, {
				pass,
				id: personId
			}, options);
		}
	}

	PersonAuth.init({
		person_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		pass: {
			type: DataTypes.STRING(100)
		},

		email_confirmed: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'person_auth',
		modelName: 'personAuth',
		sequelize
	});

	return PersonAuth;
}

export interface IPersonAuthModel extends ExtendedModel, IPersonAuth {
}

export type IPersonAuthModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonAuthModel;

	updatePass: (personId: number, pass: string, options?: object) => Promise<IPersonAuthModel>
}