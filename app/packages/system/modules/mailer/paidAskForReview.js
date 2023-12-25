const Base = require('./base');
const pathAlias = require('path-alias');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const db = wrapperRegistry.getDb();

class PaidAskForReview extends Base {
	constructor(...args) {
		super(...args);

		this.instances = [];
		this.alias = 'paidAskForReview';
		this.notificationPath = `@p-system/notifications/${this.alias}`;
	}

	async checkCondition() {
		let rows = await db.sql(`
			select 
				instance.instance_id
			from 
				instance_log 
				inner join instance using(instance_id)
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
				instance_log.action = 'transaction' 
				and instance_log.transaction_type = 'topUp' 
				and date_trunc('day', instance_log.ts) = date_trunc('day', now() - interval '2 day')
				and instance.status = 'available'
				and instance.is_demo is false
				and instance.is_free is false
				and (
					log.ts is null 
					or log.ts < now() - interval '5 days'
				)
				and not exists (
					select 
						1 
					from 
						instance_review 
					where
						instance_review.instance_id = instance.instance_id
						and review_left_at is not null
				)
		`, {
			alias: this.alias
		});

		this.instances = rows;
		return [Boolean(rows.length), ''];
	}

	async collectData() {
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

module.exports = PaidAskForReview;