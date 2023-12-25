import Form from '../../../modules/form/index';
import DbCleaner from '../modules/dbCleaner';

export default class DbCleanUp extends Form {
	getRules() {
		return [
			['verificationWord', 'validateVerWord']
		];
	}

	async save() {
		const dbCleaner = new DbCleaner(this.getInstanceRegistry(), this.getUser().getId());

		await dbCleaner.clean();

		const data = await this.getInstanceRegistry().getSettings().get('system', 'cleanUp');
		const notDemoClean = Boolean(data.length);
		const date = new Date();
		data.push(date);

		await this.getInstanceRegistry().getSettings().set('system', 'cleanUp', data);
		if (notDemoClean) {
			//@ts-ignore
			await this.getModel('filter').createDefaultFilter(this.getI18n());
		}
	}

	validateVerWord(value, options, field) {
		if (String(value).toLowerCase() !== 'clean') {
			this.addError(field, 'wrongValWord', this.__('You should type \'%s\'', ['clean']));
		}
		return true;
	}
}