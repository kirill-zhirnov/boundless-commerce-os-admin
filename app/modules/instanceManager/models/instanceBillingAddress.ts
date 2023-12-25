import ExtendedModel from '../../db/model';
import {IInstanceBillingAddress} from '../../../@types/instances';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class InstanceBillingAddress extends ExtendedModel {
	}

	InstanceBillingAddress.init({
		instance_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		first_name: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		last_name: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		is_company: {
			type: DataTypes.BOOLEAN,
			allowNull: true
		},
		company_name: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		vat_number: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		country_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		zip_code: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		state: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		city: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		address: {
			type: DataTypes.STRING(500),
			allowNull: true
		},
	},{
		tableName: 'instance_billing_address',
		modelName: 'instanceBillingAddress',
		sequelize
	});
}

export interface IInstanceBillingAddressModel extends ExtendedModel, IInstanceBillingAddress {

}

export type IInstanceBillingAddressModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IInstanceBillingAddressModel;
}