const DemoBeforeRm = require('./demoBeforeRm');
const pathAlias = require('path-alias');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const db = wrapperRegistry.getDb();

class PaidBeforeRm extends DemoBeforeRm {
	constructor(...args) {
		super(...args);

		this.alias = 'paidBeforeRm';
		this.notificationPath = `@p-system/notifications/${this.alias}`;
	}

	async checkCondition() {
		let deleteAfter = wrapperRegistry.getConfig().instanceManager.removeUnavailableAfterDays;

		let rows = await db.sql(`
			select
				instance.instance_id
			from
				instance
				left join (
					select
						instance_id, max(ts) as ts
					from
						mail_log
					where
						mail_alias = :alias
					group by 
						instance_id
				) log on log.instance_id = instance.instance_id
			where
				instance.is_free is false
				and is_demo is false
				and instance.status = 'unavailable'
				and (
					log.ts is null 
					or log.ts < now() - interval '1 days'
				)
				and date_trunc('day', paid_till + interval '${deleteAfter} days' - interval '3 days') = date_trunc('day', now())
		`, {
			alias: this.alias
		});

		this.instances = rows;
		return [Boolean(rows.length > 0), ''];
	}
}

module.exports = PaidBeforeRm;