import ExtendedModel from '../../db/model';
import {ICurrency, TCurrencyAlias} from '../../../@types/system';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Currency extends ExtendedModel {
		static async findUsd(): Promise<ICurrencyModel> {
			const row = await this.sequelize.model('currency').findOne({
				where: {
					alias: TCurrencyAlias.usd
				}
			}) as ICurrencyModel;

			if (!row) {
				throw new Error('Cant find USD currency');
			}

			return row;
		}
	}

	Currency.init({
		currency_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT(3)
		},

		code: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'currency',
		modelName: 'currency',
		sequelize
	});

	return Currency;
}

export interface ICurrencyModel extends ExtendedModel, ICurrency {}
export type ICurrencyModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICurrencyModel;

	findUsd: () => Promise<ICurrencyModel>;
}