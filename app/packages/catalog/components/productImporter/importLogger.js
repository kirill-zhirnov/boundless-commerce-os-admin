export default class ProductImportLogger {
	constructor(db, importRow) {
		this.db = db;
		this.importRow = importRow;
		this.stats = {
			inserted: 0,
			updated: 0,
			skipped: 0,
			appendedVariants: 0,
			updatedVariants: 0,
			categoryInserted: 0,
			categoryUpdated: 0,
			imagesSkipped: 0,
			imagesUploaded: 0,
		};

		this.imagesAdded = false;
		this.availableToAdd = null;

		this.log = null;
	}

	async init(currentStatus = null) {
		let instance = await this.find(currentStatus);
		if (!instance) {
			instance = await this.create();
		}
		this.log = instance;
	}

	async find(currentStatus) {
		if (currentStatus == null) {currentStatus = 'ready_for_import';}
		return await this.db.model('productImportLog').findOne({
			where: {
				import_id: this.importRow.import_id,
				status: currentStatus
			}
		});
	}

	async create() {
		const attrs = {
			import_id: this.importRow.import_id
		};

		if (this.importRow.source_type === 'url') {
			attrs.status = 'awaiting_download';
		} else {
			attrs.status = 'awaiting_setup';
			attrs.file_name = this.importRow.file_name;
			attrs.file_path = this.importRow.file_path;
		}

		return await this.db.model('productImportLog').create(attrs);
	}

	async update(attrs) {
		return await this.log.update(attrs);
	}

	getLogId() {
		return this.log.log_id;
	}

	getLogRow() {
		return this.log;
	}

	addInserted() {
		this.stats.inserted++;
		return this;
	}

	addUpdated() {
		this.stats.updated++;
		return this;
	}

	addSkipped() {
		this.stats.skipped++;
		return this;
	}

	setImagesSkipped(val) {
		this.stats.imagesSkipped = val;
		return this;
	}

	setImagesUploaded(val) {
		this.stats.imagesUploaded = val;
		return this;
	}

	addAppendedVariants() {
		this.stats.appendedVariants++;
		return this;
	}

	addUpdatedVariants() {
		this.stats.updatedVariants++;
		return this;
	}

	addCategoryInserted() {
		this.stats.categoryInserted++;
		return this;
	}

	addCategoryUpdated() {
		this.stats.categoryUpdated++;
		return this;
	}

	getStats() {
		return this.stats;
	}

	areImagesAdded() {
		return this.imagesAdded;
	}

	setImagesAdded(val) {
		this.imagesAdded = val;
	}

	setAvailableToAdd(val) {
		this.availableToAdd = val;
	}

	getAvailableToAdd() {
		return this.availableToAdd;
	}

	reduceAvailableToAdd() {
		this.availableToAdd--;
	}

	isProductInsertAllowed() {
		if (this.availableToAdd <= 0) {
			this.addSkipped();
			return false;
		} else {
			return true;
		}
	}

	getImportRow() {
		return this.importRow;
	}
}