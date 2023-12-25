import {wrapperRegistry} from '../../../registry/server/classes/wrapper';
import SampleCreator from './creator';

export default class SampleReCreator {
	constructor() {
		this.db = wrapperRegistry.getDb();
	}

	async reCreate() {
		const rows = await this.db.sql('select * from sample');
		for (const row of Array.from(rows)) {
			//@ts-ignore
			const creator = new SampleCreator(row.from_instance_id, row.alias);
			await creator.create();
		}
	}
}