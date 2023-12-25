import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Reserve extends ExtendedModel {
	}

	Reserve.init({
		reserve_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		order_id: {
			type: DataTypes.INTEGER
		},

		total_qty: {
			type: DataTypes.INTEGER
		},

		total_price: {
			type: DataTypes.DECIMAL(20, 2)
		},

		completed_at: {
			type: DataTypes.DATE,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'reserve',
		modelName: 'reserve',
		sequelize
	});

	return Reserve;
}

export interface IReserveModel extends ExtendedModel {
	reserve_id: number;
	order_id: number|null;
	total_qty: number;
	total_price: number|null;
	created_at: string;
	completed_at: string|null;
}

export type IReserveModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IReserveModel;
}