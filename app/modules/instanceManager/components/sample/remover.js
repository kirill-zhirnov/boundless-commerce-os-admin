import {wrapperRegistry} from '../../../registry/server/classes/wrapper';
import utils from '../../../utils/server';
const wrapperConfig = wrapperRegistry.getConfig();
import fs from 'fs';
import childProcess from 'child_process';

export default class SampleRemover {
	constructor(sampleAlias) {
		this.sampleAlias = sampleAlias;
		this.db = wrapperRegistry.getDb();

		this.sampleDbName = `sample_${this.sampleAlias}`;
		this.samplePath = `${wrapperConfig.instanceManager.samplesPath}/${this.sampleAlias}`;
	}

	remove() {
		return utils.runFlow(this, [
			'removeDb',
			'removeFiles'
		]);
	}

	async removeDb() {
		await this.db.sql('delete from sample where alias = :alias', {
			alias: this.sampleAlias
		});
		await this.db.sql(`drop database if exists ${this.sampleDbName}`);
	}

	async removeFiles() {
		if (!fs.existsSync(this.samplePath)) return;

		const cmd = `${wrapperConfig.instanceManager.rmCmd} ${this.samplePath}`;
		await childProcess.exec(cmd);
	}
}