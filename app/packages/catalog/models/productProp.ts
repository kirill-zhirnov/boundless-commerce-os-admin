import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IProductProp} from '../../../@types/product';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class ProductProp extends ExtendedModel {
		static async extendExtra(productId: number, extExtra: {[key: string]: any}): Promise<void> {
			const [row] = await this.sequelize.sql<{extra: {[key: string]:any}|null}>(`
				select
					extra
				from
					product_prop
				where
					product_id = :product
			`, {
				product: productId
			});

			if (row) {
				const extra = row.extra || {};
				Object.assign(extra, extExtra);

				await this.update({extra}, {
					where: {
						product_id: productId
					}
				});
			}
		}
	}

	ProductProp.init({
		product_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		available_qty: {
			type: DataTypes.INTEGER
		},

		reserved_qty: {
			type: DataTypes.INTEGER
		},

		layout: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		country_of_origin: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		extra: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		size: {
			type: DataTypes.JSONB
		},

		//		compiled characteristics for quick search or output:
		characteristic: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		tax_status: {
			type: DataTypes.ENUM('none', 'taxable')
		},

		tax_class_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'product_prop',
		modelName: 'productProp',
		sequelize
	});

	return ProductProp;
}

export interface IProductPropModel extends ExtendedModel, IProductProp {
}

export type IProductPropModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): IProductPropModel;

	extendExtra: (productId: number, extExtra: {[key: string]: any}) => Promise<void>;
}