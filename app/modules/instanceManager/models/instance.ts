// @ts-nocheck

import ExtendedModel from '../../db/model';
import _ from 'underscore';
import moolah from 'moolah';
import moment from 'moment';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import BasicComponent from '../components/basic';
import {BuildOptions, Transaction} from 'sequelize';
import {IInstanceConfig} from '../../../@types/config';
import {IInstance} from '../../../@types/instances';
import {ITariffModel} from './tariff';
import {IWixAppModel} from './wixApp';
import {IInstanceBillingAddressModel} from './instanceBillingAddress';

export default function (sequelize, DataTypes) {
	class Instance extends ExtendedModel {
		changeStatus(instanceProps, logProps, trx) {
			//@ts-ignore
			return this.sequelize.model('instance')
				.changeStatus(this.instance_id, instanceProps, logProps, trx)
				;
		}

		setUnavailable(instanceProps, logProps, trx) {
			//@ts-ignore
			return this.sequelize.model('instance')
				.setUnavailable(this.instance_id, instanceProps, logProps, trx);
		}

		setAvailable(instanceProps, logProps, trx) {
			//@ts-ignore
			return this.sequelize.model('instance')
				.setAvailable(this.instance_id, instanceProps, logProps, trx);
		}

		removeInstance(instanceProps: {[k:string]: any}, logProps: {[k:string]: any}, trx: Transaction) {
			//@ts-ignore
			return this.sequelize.model('instance')
				.removeInstance(this.instance_id, instanceProps, logProps, trx);
		}

		calcAllowedPaymentAmount() {
			if (!this.tariff) {
				throw new Error('Tariff should be loaded!');
			}

			//@ts-ignore
			return this.sequelize.model('instance')
				.calcAllowedPaymentAmount({
					balance: this.balance,
					tariff_amount: this.tariff.amount,
					tariff_billing_period: this.tariff.billing_period
				});
		}

		async findOrCreateBillingAddress(): Promise<IInstanceBillingAddressModel> {
			await this.sequelize.sql(`
				insert into instance_billing_address
					(instance_id)
				values
					(:instanceId)
				on conflict do nothing
			`, {
				instanceId: this.instance_id
			});

			const address = await this.sequelize.model('instanceBillingAddress').findOne({
				where: {
					instance_id: this.instance_id
				}
			}) as IInstanceBillingAddressModel;

			return address;
		}

		static async countAwaiting() {
			const [row] = await this.sequelize.sql(`
				select
					count(*) as total
				from
					instance
				where
					status = 'awaitingForClient'
					and client_id is null
			`);

			return row.total;
		}

		static countAwaitingPerCategory() {
			return this.sequelize.sql('\
select \
sample.alias, \
count(*) as total \
from \
instance \
left join sample on sample.sample_id = instance.from_sample_id \
where \
instance.status = \'awaitingForClient\' \
and instance.client_id is null \
group by \
sample.alias\
').then(rows => {
				const out = {};
				for (const row of Array.from(rows)) {
					const key = row.alias ? row.alias : '_default';
					out[key] = row.total;
				}

				return out;
			});
		}

		static async calcNeedToCreatePerCategory(awaitingPerCategory) {
			const totalPerCategory = await this.countAwaitingPerCategory();
			const rows = await this.sequelize.model('sample').findAll({
				where: {
					status: 'available'
				}
			});

			const needToCreate = {_default: awaitingPerCategory};
			for (const row of rows) {
				needToCreate[row.alias] = awaitingPerCategory;
			}

			for (const key in needToCreate) {
				// const val = needToCreate[key];
				if (key in totalPerCategory) {
					needToCreate[key] -= totalPerCategory[key];
				}
			}
		}

		static async createInstance(instanceProps = {}, logData = null) {
			_.defaults(instanceProps, {
				status: 'inTheMaking'
			});

			const logProps = {
				action: 'creation',
				status: instanceProps.status,
				data: logData
			};

			const trx = await this.sequelize.transaction({autocommit: false});
			try {
				const [row] = await this.sequelize.sql(`
					select
						tariff_id,
						currency_id
					from
						tariff
					where
						is_default is true
						and deleted_at is null
				`);
				if (!row) {
					throw new Error('Default tariff not found! Cannot create instance');
				}

				instanceProps.tariff_id = row.tariff_id;
				instanceProps.currency_id = row.currency_id;

				logProps.tariff_id = instanceProps.tariff_id;

				const instanceRow = await this.sequelize.model('instance').build(instanceProps).save({transaction: trx});
				logProps.instance_id = instanceRow.instance_id;

				await this.sequelize.model('instanceLog')
					.build(logProps)
					.save({transaction: trx})
				;

				await trx.commit();

				return instanceRow;
			} catch (e) {
				await trx.rollback();
				throw e;
			}
		}

		static async changeStatus(id, instanceProps, logProps = {}, trx = true) {
			if (!instanceProps.status)
				throw new Error('Status should be passed im instanceProps');

			_.extend(logProps, {
				instance_id: id,
				status: instanceProps.status
			});

			_.defaults(logProps, {
				action: 'changeStatus'
			});

			let commitTrx = false, realTrx;
			try {
				if (trx === true) {
					commitTrx = true;
					realTrx = await this.sequelize.transaction();
				} else {
					realTrx = trx;
				}

				await this.sequelize.model('instance').update(instanceProps, {
					where: {
						instance_id: id
					},
					transaction: realTrx
				});
				await this.sequelize.model('instanceLog')
					.build(logProps)
					.save({transaction: realTrx})
				;

				if (commitTrx) {
					await realTrx.commit();
				}
			} catch (e) {
				if (commitTrx) {
					await realTrx.rollback();
				}

				throw e;
			}
		}

		static calcAllowedPaymentAmount(instanceRow) {
			let amount;
			if (instanceRow.balance >= instanceRow.tariff_amount) {
				return false;
			}

			switch (instanceRow.tariff_billing_period) {
				case 'month':
					amount = moolah(instanceRow.tariff_amount).less(instanceRow.balance).float();
					break;

				case 'day':
					amount = moolah(instanceRow.tariff_amount).times(30).less(instanceRow.balance).float();
					break;
			}

			if (amount < 0) {
				return false;
			}

			return amount;
		}

		static calcAvailableTill(instanceRow) {
			if ((instanceRow.paid_till == null)) {
				return null;
			}

			const paidTill = moment(instanceRow.paid_till);

			const billingCycles = Math.floor(moolah(instanceRow.balance).by(instanceRow.tariff_amount).float());

			switch (instanceRow.tariff_billing_period) {
				case 'month':
					paidTill.add(billingCycles, 'M');
					break;

				case 'day':
					paidTill.add(billingCycles, 'd');
					break;
			}

			return paidTill;
		}

		static calcWhenWillBeRemoved(instanceRow) {
			if ((instanceRow.unavailable_since == null)) {
				return null;
			}

			let removeAfterDays = wrapperRegistry.getConfig().instanceManager.removeUnavailableAfterDays;
			if (instanceRow.is_demo) {
				removeAfterDays = 0;
			}
			const willBeRemoved = moment(instanceRow.unavailable_since).add(removeAfterDays, 'd');

			return willBeRemoved;
		}

		static setUnavailable(instanceId, instanceProps, logProps = {}, trx = true) {
			_.defaults(instanceProps, {
				status: 'unavailable',
				available_since: null,
				unavailable_since: this.sequelize.fn('now')
			});

			_.defaults(logProps, {
				action: 'changeAvailability'
			});

			return this.changeStatus(instanceId, instanceProps, logProps, trx);
		}

		static setAvailable(instanceId, instanceProps, logProps = {}, trx = true) {
			_.defaults(instanceProps, {
				status: 'available',
				available_since: this.sequelize.fn('now'),
				unavailable_since: null
			});

			_.defaults(logProps, {
				action: 'changeAvailability'
			});

			return this.changeStatus(instanceId, instanceProps, logProps, trx);
		}

		static removeInstance(instanceId, instanceProps, logProps, trx) {
			if (logProps == null) {
				logProps = {};
			}
			if (trx == null) {
				trx = true;
			}
			_.defaults(instanceProps, {
				status: 'removed',
				available_since: null,
				unavailable_since: null,
				paid_till: null
			});

			_.defaults(logProps, {
				action: 'removing'
			});

			return this.changeStatus(instanceId, instanceProps, logProps, trx);
		}

		static async changeTariff(instanceId, newTariffId, resetCache = true) {
			let trx: Transaction|null = await this.sequelize.transaction({autocommit: false});
			try {
				await this.update({
					tariff_id: newTariffId
				}, {
					transaction: trx,
					where: {
						instance_id: instanceId
					}
				});

				await this.sequelize.sql(`
					insert into instance_log
						(instance_id, action, tariff_id)
					values
						(:instanceId, 'changeTariff', :newTariffId)
				`, {
					instanceId,
					newTariffId
				}, {transaction: trx});

				await trx.commit();
				trx = null;

				if (resetCache) {
					const component = new BasicComponent(instanceId);
					return component.processResetCache(instanceId);
				}
			} catch (e) {
				if (trx) {
					await trx.rollback();
				}
				throw e;
			}
		}

		static isInstanceExpiredSoon(info) {
			const paidTill = this.calcAvailableTill(info);

			if (!paidTill) {
				return false;
			}

			const time = moment().add(10, 'd');

			if (paidTill.isBefore(time)) {
				return true;
			}

			return false;
		}

		static async markJustUsed(instanceId: number) {
			await this.sequelize.sql(`
				update instance set last_usage_at = now() where instance_id = :instanceId
			`, {
				instanceId
			});
		}
	}

	Instance.init({
		instance_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		status: {
			type: DataTypes.STRING(30)
		},

		path: {
			type: DataTypes.STRING(30),
			allowNull: true
		},

		client_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		tariff_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		balance: {
			type: DataTypes.DECIMAL(20, 2)
		},

		currency_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		is_demo: {
			type: DataTypes.BOOLEAN
		},

		available_since: {
			type: DataTypes.DATE
		},

		unavailable_since: {
			type: DataTypes.DATE
		},

		paid_till: {
			type: DataTypes.DATE
		},

		remove_me: {
			type: DataTypes.DATE
		},

		last_usage_at: {
			type: DataTypes.DATE
		},

		data: {
			type: DataTypes.JSONB
		},

		client_email: {
			type: DataTypes.STRING(255)
		},

		from_sample_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		config: {
			type: DataTypes.JSON,
			allowNull: true
		},

		renew: {
			type: DataTypes.BOOLEAN
		},

		quickpay_subscription_id: {
			type: DataTypes.BIGINT,
			allowNull: true
		}
	}, {
		tableName: 'instance',
		modelName: 'instance',
		sequelize
	});

	return Instance;
}


export interface IInstanceModel extends ExtendedModel, IInstance {
	readonly tariff?: ITariffModel;
	readonly wixApp?: IWixAppModel;

	changeStatus(instanceProps: {}, logProps: {}): Promise

	setAvailable(instanceProps: {}, logProps: {}): Promise

	setUnavailable(instanceProps: {}, logProps: {}): Promise

	removeInstance(instanceProps: {[k:string]: any}, logProps: {[k:string]: any}, trx?: Transaction): Promise<void>

	findOrCreateBillingAddress: () => Promise<IInstanceBillingAddressModel>;
}

export type IInstanceModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IInstanceModel;

	createInstance(): Promise<IInstanceModel>;

	changeStatus(instanceId: number, instanceProps: {}, logProps: {}, trx): Promise<>;

	changeTariff(instanceId: number, newTariffId: number, resetCache?: boolean): Promise<void>;

	markJustUsed(instanceId: number): Promise<void>
}