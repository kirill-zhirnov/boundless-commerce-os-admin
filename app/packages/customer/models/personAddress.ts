import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPersonAddress} from '../../../@types/person';
import {BuildOptions} from 'sequelize';
import {ICountryModel} from '../../delivery/models/country';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PersonAddress extends ExtendedModel {
		static async checkIsDefaultExists(personId: number) {
			const total = await this.count({
				where: {
					person_id: personId,
					is_default: true
				}
			});

			if (!total) {
				await this.sequelize.sql(`
					update person_address set is_default = true where address_id in (
						select address_id from person_address where person_id = :personId limit 1
					)
				`,{
					personId: personId
				});
			}
		}
	}

	PersonAddress.init({
		address_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		person_id: {
			type: DataTypes.INTEGER,
		},

		type: {
			type: DataTypes.ENUM('billing', 'shipping'),
			allowNull: true
		},

		is_default: {
			type: DataTypes.BOOLEAN
		},

		first_name: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		last_name: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		company: {
			type: DataTypes.STRING(200),
			allowNull: true
		},

		address_line_1: {
			type: DataTypes.STRING(300),
			allowNull: true
		},

		address_line_2: {
			type: DataTypes.STRING(300),
			allowNull: true
		},

		city: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		state: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		country_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		zip: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		phone: {
			type: DataTypes.STRING(100),
			allowNull: true
		},

		comment: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'person_address',
		modelName: 'personAddress',
		sequelize
	});

	return PersonAddress;
}

export interface IPersonAddressModel extends ExtendedModel, IPersonAddress {
	readonly country?: ICountryModel;
}

export type IPersonAddressModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPersonAddressModel;

	checkIsDefaultExists: (personId: number) => Promise<void>;
}