import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {ITaxClass} from '../../../@types/system';
import {BuildOptions} from 'sequelize';
import {ITaxRateModel} from './taxRate';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class TaxClass extends ExtendedModel {
		static async resetDefaults() {
			await this.sequelize.model('taxClass').update({is_default: false}, {
				where: {}
			});
		}

		static async checkDefaultExists() {
			const qty = await this.sequelize.model('taxClass').count({
				where: {
					is_default: true
				}
			});

			if (qty === 0) {
				await this.sequelize.sql(`
					update tax_class set is_default = true where tax_class_id in (
						select tax_class_id from tax_class limit 1
					)
				`);
			}
		}

		static async findTaxClassOptions(out: (string|number)[][] = []): Promise<(string|number)[][]> {
			const rows = await (this.sequelize.model('taxClass') as ITaxClassModelStatic).findAll({
				order: [
					['title', 'asc']
				]
			});

			return out.concat(
				rows.map(({tax_class_id, title}) => [tax_class_id, title])
			);
		}
	}

	TaxClass.init({
		tax_class_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(50)
		},
		is_default: {
			type: DataTypes.BOOLEAN
		},
		created_at: {
			type: DataTypes.DATE
		},
	}, {
		tableName: 'tax_class',
		modelName: 'taxClass',
		sequelize
	});

	return TaxClass;
}

export interface ITaxClassModel extends ExtendedModel, ITaxClass {
	readonly taxRates?: ITaxRateModel[];
}

export type ITaxClassModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): ITaxClassModel;

	resetDefaults: () => Promise<void>;
	checkDefaultExists: () => Promise<void>;
	findTaxClassOptions: (out?: (string|number)[][]) => Promise<(string|number)[][]>;
}
