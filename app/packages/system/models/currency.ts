import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {BuildOptions} from 'sequelize';
import InstanceRegistry from '../../../modules/registry/server/classes/instance';
import JedExtended from '../../../modules/i18n/jed.client';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Currency extends ExtendedModel {
		static async bootstrapDefaultCurrency(instanceRegistry: InstanceRegistry) {
			const value = await instanceRegistry.getSettings().get('system', 'currency');

			const row = await this.sequelize.model('currency').findOne({
				where: {
					alias: value.alias
				}
			});

			if (!row)
				throw new Error(`cannot bootstrap currency ${value.alias}`);

			return row.toJSON();
		}

		static async loadOptions(i18n: JedExtended, out = [], key = 'alias') {
			const rows = await this.sequelize.sql<ICurrencyRow>('select * from currency order by title');

			for (const row of rows) {
				const id = row[key];
				const title = `${row.title} (${String(row.alias).toUpperCase()})`;

				out.push([id, title, {alias: row.alias, code: row.code}]);
			}

			return out;
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
		},

		title: {
			type: DataTypes.STRING(255)
		},

	}, {
		tableName: 'currency',
		modelName: 'currency',
		sequelize
	});
}

export interface ICurrencyModel extends ExtendedModel {
	currency_id: number;
	alias: string;
	code: number;
	title: string;
}

export type ICurrencyModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): ICurrencyModel;

	bootstrapDefaultCurrency(instanceRegistry: InstanceRegistry): Promise<ICurrencyRow>;

	loadOptions(i18n: JedExtended, out: [], key: string): Promise<[]>;
}

export type ICurrencyRow = Pick<ICurrencyModel, 'currency_id' | 'alias' | 'code' | 'title'>;