import * as instances from '../../instances';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import {IInstanceModel, IInstanceModelStatic} from '../models/instance';
import ExtendedSequelize from '../../db/sequelize';
import {Transaction} from 'sequelize/types';
import {bootstrapInstanceById} from '../../bootstrap/instance';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';

export default class BasicComponent {
	protected readonly db: ExtendedSequelize;
	protected instance: IInstanceModel|null = null;
	protected resetCache: boolean = true;
	protected instanceRegistry: IInstanceRegistry = null;
	private trx: Transaction = null;
	private shallCommitTrx: boolean = false;

	constructor(
		protected readonly instanceId: number = null,
		protected reason: string = null,
	) {
		this.db = wrapperRegistry.getDb();
	}

	public async processResetCache(ids) {
		if (ids == null) {
			ids = this.instance.instance_id;
		}
		if (!this.resetCache)
			return;

		await this.refreshInstancesCache();
		// await this.triggerRefreshInstanceInfo(ids);
	}

	public setResetCache(resetCache) {
		this.resetCache = resetCache;
		return this;
	}

	public setTrx(trx) {
		this.trx = trx;
		return this;
	}

	protected refreshInstancesCache() {
		return instances.refreshCache();
	}

	protected async triggerRefreshInstanceInfo(ids?: number) {
		// if (!ids) {
		// 	ids = this.instance.instance_id;
		// }
		// const redis = wrapperRegistry.getRedisMsgSend();
		// await redis.publish('worker', JSON.stringify({
		// 		type: 'refreshInstanceInfo',
		// 		data: {
		// 			instance_id: ids
		// 		}
		// 	})
		// );

		return this.refreshInstance();
	}

	protected async loadInstance(): Promise<void> {
		const instance: IInstanceModel = await (this.db.model('instance') as IInstanceModelStatic).findOne({
			include : [
				{
					model : this.db.model('tariff')
				},
				{
					model : this.db.model('wixApp')
				},
			],
			where : {
				instance_id : this.instanceId
			},
			transaction: this.trx
		});

		if (!instance) {
			throw new Error('Instance not found!');
		}

		this.instance = instance;
	}

	protected async commitTrx() {
		if (!this.shallCommitTrx) return;

		await this.trx.commit();
		this.shallCommitTrx = false;
	}

	protected rollbackTrx() {
		return !this.shallCommitTrx ? undefined : this.trx.rollback();
	}

	protected async startTrx() {
		if (this.trx) return;

		this.trx = await this.db.transaction({autocommit: false});
		this.shallCommitTrx = true;
	}

	protected setReason(reason) {
		this.reason = reason;
		return this;
	}

	async getInstanceRegistry() {
		if (!this.instanceRegistry) {
			this.instanceRegistry = await bootstrapInstanceById(this.instance.instance_id, false);
		}

		return this.instanceRegistry;
	}

	private refreshInstance() {
		// wait 20 ms which needs to refresh instance
		return new Promise(resolve => setTimeout(resolve, 100));
	}
}
