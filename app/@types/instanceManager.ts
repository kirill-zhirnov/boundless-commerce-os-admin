import {Request, Response} from 'express';
import {TInstanceStatus} from './instances';

export interface IInstanceManagerBaseController {}

export interface IInstanceManagerController {
	new(req: Request, res: Response): IInstanceManagerBaseController
}

export enum TInstanceLogAction {
	Creation = 'creation',
	ChangeStatus = 'changeStatus',
	ChangeAvailability = 'changeAvailability',
	BindClient = 'bindClient',
	Transaction = 'transaction',
	Removing = 'removing',
	ChangeTariff = 'changeTariff',
	Refund = 'refund'
}

export enum TInstanceLogTransactionType {
	TopUp = 'topUp',
	TopUpCredit = 'topUpCredit',
	WithdrawByTariff = 'withdrawByTariff',
	WithdrawCredit = 'withdrawCredit',
	WithdrawPaymentByPeriod = 'withdrawPaymentByPeriod',
}

export interface IInstanceLog {
	log_id: number,
	instance_id: number,
	action: TInstanceLogAction,
	status?: TInstanceStatus,
	transaction_type?: TInstanceLogTransactionType,
	amount?: number,
	tariff_id?: number,
	data?: {[k:string]: any},
	ts: Date
}