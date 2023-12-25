import Creator from '../creator';
import {wrapperRegistry} from '../../../registry/server/classes/wrapper';
import * as utils from '../../../utils/server';

export default class FromSampleCreator extends Creator {
	constructor(createFromAlias) {
		super();

		this.createFromAlias = createFromAlias;

		this.sampleRow = null;
		this.samplePath = null;
	}

	create() {
		return utils.runFlow(this, [
			'loadSample',
			'createInstance',
			'createFolder',
			'setupHosts',
			'createInstanceConfig',
			'setupDb',
			//нужно добавить копирование файлов с семпла в будущем
			// 'copyFiles',
			// 'setAccessRights',
			'bootstrapInstance',
			// 'addDemoDelivery',
			//			'installTheme',
			//			'createPageLayouts',
			'setupRobotsTxt',
			'markAsCreated',
			'triggerCreated'
		]);
	}

	async createInstance() {
		//@ts-ignore
		this.instance = await this.db.model('instance').createInstance({
			from_sample_id: this.sampleRow.sample_id
		});
	}

	// copyFiles() {
	// 	const files =
	// 		{[`${this.samplePath}/home`]: `${this.instanceRoot}/home`};
	//
	// 	return this.processCopyFiles(files);
	// }

	async loadSample() {
		const rows = await this.db.sql(`
			select
				*
			from
				sample
			where
				alias = :alias
				and status = 'available'
		`, {
			alias: this.createFromAlias
		});

		if (!rows.length) {
			throw new Error(`Sample with alias '${this.createFromAlias}' not found!`);
		}

		this.sampleRow = rows[0];
		//@ts-ignore
		this.sampleDb = `sample_${this.sampleRow.alias}`;
		//@ts-ignore
		this.samplePath = `${wrapperRegistry.getConfig().instanceManager.samplesPath}/${this.sampleRow.alias}`;
	}
}