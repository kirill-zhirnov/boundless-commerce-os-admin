import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {BuildOptions} from 'sequelize';
import {IApiToken} from '../../../@types/auth';
import randomString from 'random-string';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class ApiToken extends ExtendedModel {
		static async findOrCreateTokenByName(name: string, require_exp: boolean = false, is_system: boolean = false): Promise<IApiTokenModel> {
			const token = await this.findOne({
				where: {
					name
				}
			}) as IApiTokenModel;

			if (token) {
				return token;
			}

			const newTokenRow = await this.createUniqueClientId();
			await this.update({
				name,
				secret: randomString({
					length: 33,
					numeric: true,
					letters: true,
					special: false
				}),
				require_exp,
				is_system
			}, {
				where: {
					token_id: newTokenRow.token_id
				}
			});

			return await this.findOne({
				where: {name}
			}) as IApiTokenModel;
		}

		static async createUniqueClientId(): Promise<IApiToken> {
			const client_id = randomString({
				length: 17,
				numeric: true,
				letters: true,
				special: false
			});

			const [row] = await this.sequelize.sql<IApiToken>(`
				insert into api_token
					(client_id)
				values
					(:client_id)
				on conflict do nothing
				returning *
		`, {client_id});

			if (row) {
				return row;
			}

			return this.createUniqueClientId();
		}
	}

	ApiToken.init({
		token_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		name: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		client_id: {
			type: DataTypes.STRING(20),
			allowNull: true
		},

		secret: {
			type: DataTypes.STRING(50),
			allowNull: true
		},

		permanent_token: {
			type: DataTypes.STRING(300),
			allowNull: true
		},

		require_exp: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE,
			allowNull: true
		},

		is_system: {
			type: DataTypes.BOOLEAN
		},

		can_manage: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'api_token',
		modelName: 'apiToken',
		sequelize
	});

	return ApiToken;
}

export interface IApiTokenModel extends ExtendedModel, IApiToken {
}

export type IApiTokenModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IApiTokenModel;

	createUniqueClientId: () => Promise<IApiToken>;
	findOrCreateTokenByName: (name: string, require_exp?: boolean, is_system?: boolean) => Promise<IApiTokenModel>
}