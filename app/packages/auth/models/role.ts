import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IRole, TRoleAlias} from '../../../@types/person';
import {BuildOptions, Transaction} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Role extends ExtendedModel {
		static async setAdminRoles(personId: number, trx: Transaction|null = null) {
			await this.setRoles(personId, [TRoleAlias.Admin], trx);
		}

		static async addClientRoles(personId: number) {
			await this.bindRole(personId, [TRoleAlias.Client, TRoleAlias.Guest]);
		}

		static async setClientRoles(personId: number, trx: Transaction|null = null) {
			await this.setRoles(personId, [TRoleAlias.Client], trx);
		}

		static async setGuestBuyerRoles(personId: number, trx: Transaction|null = null) {
			await this.setRoles(personId, [TRoleAlias.GuestBuyer], trx);
		}

		static async setRoles(personId: number, roles: TRoleAlias[], trx: Transaction|null = null, withGuestRole = true) {
			if (withGuestRole) roles.push(TRoleAlias.Guest);
			await this.bindRole(personId, roles, trx);
			await this.rmRolesNotIn(personId, roles, trx);
		}

		static async rmRolesNotIn(personId: number, roles: string[], trx: Transaction|null = null) {
			await this.sequelize.sql(`
				delete from
					person_role_rel
				where
					person_id = :personId
					and role_id in (
						select
							role_id
						from
							role
						where
							alias not in (${this.sequelize.escapeIn(roles.slice())})
					)
			`, {
				personId
			}, {
				transaction: trx
			});
		}

		static async rmRoles(personId: number, roles: TRoleAlias[], trx: Transaction|null = null) {
			await this.sequelize.sql(`
				delete from
					person_role_rel
				where
					person_id = :personId
					and role_id in (
						select
							role_id
						from
							role
						where
							alias in (${this.sequelize.escapeIn(roles.slice())})
					)
			`, {
				personId
			}, {
				transaction: trx
			});
		}

		static async bindRole(personId: number, roles: TRoleAlias[], trx: Transaction|null = null) {
			await this.sequelize.sql(`
				insert into person_role_rel
					(person_id, role_id)
				select
					:personId,
					role_id
				from
					role
				where
					alias in (${this.sequelize.escapeIn(roles.slice())})
				on conflict
					do nothing
			`, {
				personId
			}, {
				transaction: trx
			});
		}

		static async findRegisteredOptions(roleIdAsKey: boolean = false, out = []) {
			const rows = await this.sequelize.sql<IRole>(`
				select
					role_id,
					alias,
					title
				from
					role
				where
					alias != 'guest'
				order by
					title
			`);

			for (const row of rows) {
				const {role_id, alias, title} = row;

				const key = roleIdAsKey ? role_id : alias;
				out.push([key, title]);
			}

			return out;
		}
	}

	Role.init({
		role_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING
		},

		alias: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'role',
		modelName: 'role',
		sequelize
	});

	return Role;
}

export interface IRoleModel extends ExtendedModel, IRole {
}

export type IRoleModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IRoleModel;

	setRoles: (personId: number, roles: TRoleAlias[], trx?: Transaction) => Promise<void>;
	setAdminRoles: (personId: number, trx?: Transaction|null) => Promise<void>;
	setClientRoles: (personId: number, trx?: Transaction|null) => Promise<void>;
	setGuestBuyerRoles: (personId: number, trx?: Transaction|null) => Promise<void>;
	addClientRoles: (personId: number) => Promise<void>;
}