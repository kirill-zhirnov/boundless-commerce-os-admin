import ExtendedModel from '../../db/model';
import ExtendedSequelize from '../../db/sequelize';
import {BuildOptions} from 'sequelize';
import {IInvoice} from '../../../@types/instances';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Invoice extends ExtendedModel {
	}

	Invoice.init({
		invoice_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		instance_id: {
			type: DataTypes.INTEGER,
		},

		amount: {
			type: DataTypes.DECIMAL(20,2)
		},

		title: {
			type: DataTypes.STRING(255),
		},

		description: {
			type: DataTypes.TEXT,
		},

		type: {
			type: DataTypes.ENUM('topUp', 'paymentForPeriod'),
		},

		data: {
			type: DataTypes.JSON
		},

		created_at: {
			type: DataTypes.DATE
		},

		paid_at: {
			type: DataTypes.DATE
		},

		extend_for: {
			type: DataTypes.ENUM('month', 'year'),
		},

		number_of_periods: {
			type: DataTypes.SMALLINT,
		}
	}, {
		tableName: 'invoice',
		modelName: 'invoice',
		sequelize
	});

	return Invoice;
}

export interface IInvoiceModel extends ExtendedModel, IInvoice {
}

export type IInvoiceModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IInvoiceModel;
}