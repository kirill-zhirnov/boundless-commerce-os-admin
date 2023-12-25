import BasicCommand from '../../commands/basic';
import {create, remove, reCreate} from '../components/sample';

export default class SampleCommand extends BasicCommand {
	actionCreate() {
		const instanceId = this.getOption('instance');
		const alias = this.getOption('alias');

		if (!instanceId || !alias) {
			throw new Error('You should pass instance and alias: --instance=<id> --alias=<alias>');
		}

		return create(instanceId, alias);
	}

	actionRemove() {
		const alias = this.getOption('alias');

		if (!alias) {
			throw new Error('You should pass alias: --alias=<alias>');
		}

		return remove(alias);
	}

	actionReCreate() {
		return reCreate();
	}
}