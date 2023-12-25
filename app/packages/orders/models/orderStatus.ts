import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IOrderStatus} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';
import {IOrderStatusTextModel} from './orderStatusText';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class OrderStatus extends ExtendedModel {
		static async findStockLocationOptions() {
			const rows = await this.sequelize.sql<Pick<IOrderStatusModel, 'status_id' | 'stock_location'>>(`
				select
					status_id,
					stock_location
				from
					order_status
			`);

			const out = {};
			for (const row of rows) {
				out[row.status_id] = row.stock_location;
			}

			return out;
		}

		static async findTreeOptions(langId, out = []) {
			const rows = await this.sequelize.sql<Pick<IOrderStatusModel, 'status_id' | 'parent_id' | 'stock_location'> & {
				title: string
			}>(`
				select
					*
				from
					vw_order_status_flat_list
				where
					lang_id = :lang
				order by tree_sort
			`, {
				lang: langId
			});

			const id2Index = {};
			for (const row of rows) {
				const {parent_id, status_id, title} = row;

				let arr;
				if (parent_id === null) {
					arr = out;
				} else {
					if (!Array.isArray(out[id2Index[parent_id]][1])) {
						out[id2Index[parent_id]] = [out[id2Index[parent_id]][1], []];
					}

					arr = out[id2Index[parent_id]][1];
				}

				arr.push([status_id, title, _.pick(row, ['alias', 'background_color', 'stock_location'])]);
				id2Index[status_id] = arr.length - 1;
			}

			return out;
		}

		static async loadAvailable() {
			return this.sequelize.sql(`
				select
					*
				from
					order_status
					inner join order_status_text using(status_id)
				where
					deleted_at is null
				order by sort
			`);
		}
	}

	OrderStatus.init({
		status_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		parent_id: {
			type: DataTypes.INTEGER
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		stock_location: {
			type: DataTypes.ENUM('inside', 'outside')
		},

		sort: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'order_status',
		deletedAt: 'deleted_at',
		modelName: 'orderStatus',
		sequelize
	});

	return OrderStatus;
}

export interface IOrderStatusModel extends ExtendedModel, IOrderStatus {
	readonly orderStatusTexts?: IOrderStatusTextModel[];
}

export type IOrderStatusModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IOrderStatusModel;

	findTreeOptions: (langId: number, out?: any[]) => Promise<any[]>;
}