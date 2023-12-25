import DataProvider from '../../../../modules/dataProvider/index';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';

export default class ImportScheduleDataProvider extends DataProvider {
	createQuery() {
		this.q.from('product_import', 'p');
		this.q.join('( \
select \
import_id, \
count(status) as qty \
from \
product_import_log \
where \
status in (\'ready_for_import\', \'success\') \
group by import_id \
) import_log using(import_id)');
		this.q.where('p.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('p.site_id = ?', this.getEditingSite().site_id);
		this.q.where('p.run = \'cron\'');
		this.q.where('import_log.qty > 0');
		return this.compareRmStatus('p.deleted_at');
	}

	sortRules() {
		return {
			default: [{created: 'asc'}],
			attrs: {
				created: 'p.created_at'
			}
		};
	}

	async prepareData(rows) {
		if (rows.length === 0) {
			return [this.getMetaResult(), rows];
		}

		const tasks = await wrapperRegistry.getDb().model('task').findAll({
			where: {
				instance_id: this.getInstanceRegistry().getInstanceInfo().instance_id
			}
		});
		for (let task of Array.from(tasks)) {
			for (let row of Array.from(rows)) {
				//@ts-ignore
				if (task.local_id === row.import_id) {
					//@ts-ignore
					row.schedule = task.cron_rule;
				}
			}
		}

		return [this.getMetaResult(), rows];
	}
}