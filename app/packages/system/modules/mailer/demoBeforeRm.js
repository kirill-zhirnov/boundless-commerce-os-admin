const Base = require('./base');
const pathAlias = require('path-alias');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const db = wrapperRegistry.getDb();

class DemoBeforeRm extends Base {
	constructor(...args) {
		super(...args);

		this.instances = [];
		this.alias = 'demoBeforeRm';
		this.notificationPath = `@p-system/notifications/${this.alias}`;
	}

	async checkCondition() {
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
				instance.is_free = false
				and is_demo = true
				and (
					log.ts is null 
					or log.ts < now() - interval '1 days'
				)
				and date_trunc('day', paid_till - interval '3 days') = date_trunc('day', now())
		`, {
			alias: this.alias
		});

		this.instances = rows;
		return [Boolean(rows.length > 0), ''];
	}

	collectData() {
		let out = [];
		for (let row of this.instances) {
			out.push({
				instanceId: row.instance_id,
				notificationArgs: ['send']
			});
		}

		return out;
	}
}

module.exports = DemoBeforeRm;