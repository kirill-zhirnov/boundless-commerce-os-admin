import BasicCommand from '../../../modules/commands/basic';
const {bootstrapInstanceById} = require('../../../modules/bootstrap/instance');
const instances = require('../../../modules/instances');

export default class LabelCommand extends BasicCommand {
	async actionDeleteObsolete() {
		const data = await instances.loadCachedData();
		const keys = Object.keys(data.instances);

		for (let instId of Array.from(keys)) {
			const registry = await bootstrapInstanceById(Number(instId), false);
			await registry.getDb().sql('select labels_delete_obsolete()');
		}
	}
}