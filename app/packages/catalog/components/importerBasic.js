import _ from 'underscore';

export default class ImporterBasic {
	constructor(instanceRegistry, importRow = null) {
		this.instanceRegistry = instanceRegistry;
		this.importRow = importRow;
		this.db = this.instanceRegistry.getDb();

		// allow to pass importId or importRow
		if (_.isObject(this.importRow)) {
			this.importId = this.importRow.import_id;
		} else if (this.importRow) {
			this.importId = this.importRow;
			this.importRow = null;
		} else {
			this.importId = null;
		}
	}

	async run() {
		const importRow = await this.getImportRow();
		await this.process(importRow);
	}

	getImportId() {
		return this.importId;
	}

	setImportId(importId) {
		this.importId = importId;
	}

	async getImportRow() {
		if (this.importRow && (this.importRow.import_id === this.getImportId())) {
			return this.importRow;
		}

		return await this.loadImportRow(this.getImportId());
	}

	setImportRow(importRow) {
		this.importRow = importRow;
	}

	getInstanceRegistry() {
		return this.instanceRegistry;
	}

	loadImportRow(...args) {
		throw this.getNotImplementedError();
	}

	process(...args) {
		throw this.getNotImplementedError();
	}

	getNotImplementedError() {
		return new Error('Method is not implemented by child class');
	}
}