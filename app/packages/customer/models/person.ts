import ExtendedModel from '../../../modules/db/model';
import {BuildOptions, Transaction} from 'sequelize';
import {IPerson, TRoleAlias} from '../../../@types/person';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPersonProfileModel} from './personProfile';
import {IPersonAddressModel} from './personAddress';
import {Op} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Person extends ExtendedModel {
		static async createGuestVisitor(siteId: number): Promise<IPersonModel> {
			const person = await (this.sequelize.model('person') as IPersonModelStatic).build().set({
				site_id: siteId,
				registered_at: null
			}).save() as IPersonModel;

			return person;
		}

		static async findActiveByRole(role: string|string[]): Promise<IPersonModel[]> {
			const persons = await this.findAll({
				include: [
					{
						model: this.sequelize.model('role'),
						required: true,
						where: {
							alias: role
						}
					}
				],
				where: {
					deleted_at: null,
					registered_at: {
						[Op.ne]: null
					}
				}
			}) as IPersonModel[];

			return persons;
		}

		static async findOrCreateUnregistered(siteId: number, email: string): Promise<false | IPersonModel> {
			email = String(email).toLowerCase();

			const [person] = await this.findOrCreate({
				defaults: {
					site_id: siteId,
					email
				},
				where: {
					site_id: siteId,
					email
				}
			}) as [IPersonModel, boolean];

			if (person.deleted_at) {
				await person.set({deleted_at: null}).save();
			}

			if (person.registered_at) {
				return false;
			}

			return person;
		}

		static async registerPerson(personId: number, trx: Transaction | null = null) {
			await this.sequelize.sql(`
				update
					person
				set
					registered_at = now()
				where
					person_id = :id
					and registered_at is null
			`, {
				id: personId
			}, {
				transaction: trx
			});
		}

		static getPersonTitleByRow(row: (IPersonProfileModel & {email: string})) {
			if (row.first_name || row.last_name)
				return this.getFullNameByRow(row);

			if (row.email) {
				return row.email;
			}

			return null;
		}

		static getFullNameByRow(row: (IPersonProfileModel & {email: string})) {
			const name = [];
			if (row.first_name) name.push(row.first_name);
			if (row.last_name) name.push(row.last_name);
			if (row.patronymic) name.push(row.patronymic);

			return name.join(' ');
		}
	}

	Person.init({
		person_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		email: {
			type: DataTypes.STRING,
			allowNull: true
		},

		registered_at: {
			type: DataTypes.DATE,
			allowNull: true
		},

		status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},

		created_by: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		},

		is_owner: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'person',
		deletedAt: 'deleted_at',
		modelName: 'person',
		sequelize
	});

	return Person;
}

export interface IPersonModel extends ExtendedModel, IPerson {
	readonly personProfile?: IPersonProfileModel;
	readonly personAddresses?: IPersonAddressModel[];
}

export type IPersonModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonModel;

	createGuestVisitor: (siteId: number) => Promise<IPersonModel>;
	registerPerson: (personId: number, trx?: Transaction | null) => Promise<void>;
	getPersonTitleByRow: (row: (IPersonProfileModel & {email: string})) => string|null;
	findActiveByRole: (role: string|string[]|TRoleAlias[]) => Promise<IPersonModel[]>
}