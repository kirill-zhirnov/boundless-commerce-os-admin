import ExtendedModel from '../../../modules/db/model';
import {ICustomerGroup} from '../../../@types/person';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class CustomerGroup extends ExtendedModel {
		static async findCustomerOptions(out: (string|number)[][] = []) {
			const rows = await this.sequelize.sql<{group_id: number, title: string}>(`
				select
					group_id, title
				from
					customer_group
				where
					deleted_at is null
				order by title asc
			`);

			for (const row of rows) {
				out.push([String(row.group_id), row.title]);
			}

			return out;
		}
	}

	CustomerGroup.init({
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.TEXT,
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'customer_group',
		deletedAt: 'deleted_at',
		modelName: 'customerGroup',
		sequelize
	});

	return CustomerGroup;
}

export interface ICustomerGroupModel extends ExtendedModel, ICustomerGroup {}

export type ICustomerGroupModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICustomerGroupModel;

	findCustomerOptions: (out?: (string|number)[][]) => Promise<(string|number)[][]>;
}