import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {ITaxRate} from '../../../@types/system';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class TaxRate extends ExtendedModel {
		static async createTaxRate(taxClassId: number, title: string): Promise<ITaxRate> {
			const [row] = await this.sequelize.sql<ITaxRate>(`
				insert into tax_rate
					(tax_class_id, title, priority)
				select
					:tax_class_id,
					:title,
					coalesce(max(priority), -10) + 10
				from
					tax_rate
				where
					tax_class_id = :tax_class_id
				returning *
		`, {
				tax_class_id: taxClassId,
				title
			});

			return row;
		}
	}

	TaxRate.init({
		tax_rate_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		tax_class_id: {
			type: DataTypes.INTEGER,
		},
		title: {
			type: DataTypes.STRING(50)
		},
		rate: {
			type: DataTypes.DECIMAL(6, 4),
		},
		priority: {
			type: DataTypes.INTEGER,
		},
		is_compound: {
			type: DataTypes.BOOLEAN
		},
		include_shipping: {
			type: DataTypes.BOOLEAN
		},
		country_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		state_code: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		created_at: {
			type: DataTypes.DATE
		},
	}, {
		tableName: 'tax_rate',
		modelName: 'taxRate',
		sequelize
	});

	return TaxRate;
}

export interface ITaxRateModel extends ExtendedModel, ITaxRate {
}

export type ITaxRateModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): ITaxRateModel;

	createTaxRate: (taxClassId: number, title: string) => Promise<ITaxRate>;
}
