import path from 'path';
import _ from 'underscore';
import Downloader from '../../cms/modules/downloader';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import ImporterBasic from './importerBasic';
import ImportLogger from './productImporter/importLogger';
import ImportCategoryEssence from './productImporter/essences/category';
import ImportProductEssence from './productImporter/essences/product';
import ProductImportParserCsv from './productImporter/parsers/csv';
import ProductImportParserExcel from './productImporter/parsers/excel';
import ProductImportParserYml from './productImporter/parsers/yml';
import fs from 'fs';
import {promisify} from 'util';
import InstanceS3Storage from '../../../modules/s3Storage/instance';
import * as productEvents from './productEventNotification';
import {TQueueEventType} from '../../../@types/rabbitMq';
import {Op} from 'sequelize';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

export default class ProductImporter extends ImporterBasic {
	constructor(instanceRegistry, importRow = null) {
		super(instanceRegistry, importRow);

		this.importLogger = null;
	}

	async download() {
		try {
			const importRow = await this.getImportRow();
			this.importLogger = new ImportLogger(this.db, importRow);
			await this.importLogger.init('awaiting_download');
			await this.getFileByRow(importRow);
			await this.importLogger.update({
				status: importRow.type === 'yml' ? 'ready_for_import' : 'awaiting_setup'
			});
		} catch (e) {
			await this.importLogger.update({
				status: 'error',
				result: e
			});

			if (!e.resolve) throw e;
		}
	}

	async getFirstRows(qty = 3) {
		try {
			const importRow = await this.getImportRow();
			this.importLogger = new ImportLogger(this.db, importRow);
			await this.importLogger.init(['awaiting_download', 'awaiting_setup']);
			const {filePath} = await this.getFileByRow(importRow);
			const parser = this.createParser(importRow.type, filePath, importRow.settings);
			//@ts-ignore
			const rows = await parser.getFirstRows(qty);  //FIXME: ProductImportParserYml does not have this method

			return rows;
		} catch (e) {
			await this.importLogger.update({
				status: 'error',
				result: e
			});
			throw e;
		}
	}

	async process(importRow) {
		this.importLogger = new ImportLogger(this.db, importRow);

		try {
			await this.importLogger.init();
			await this.countAvailableProductsToAdd();
			const {filePath} = await this.getFileByRow(importRow);
			await this.importLogger.update({status: 'in_progress'});
			const parser = this.createParser(importRow.type, filePath, importRow.settings);
			await parser.parse(this.saveRow.bind(this));
		} catch (e) {
			console.error(e);
			await this.importLogger.update({
				status: 'error',
				result: e
			});
		}
	}

	async finishImport() {
		await this.deleteLocalFile(this.getAbsoluteFilePath(this.importRow.file_path));
		await this.deleteS3File(this.importRow.cloud_path);
		await this.logSuccess();
		await this.notifyImportResults();
	}

	async countAvailableProductsToAdd() {
		const limitValue = this.instanceRegistry.getTariff().getLimitValue('productLimit');

		if (limitValue === true) {
			this.importLogger.setAvailableToAdd(Infinity);
			return;
		}

		const [row] = await this.db.sql(`
			select
				count(product_id) as qty
			from
				product
			where
				deleted_at is null
		`);

		this.importLogger.setAvailableToAdd(limitValue - parseInt(row.qty));
	}

	async deleteLocalFile(absolutePath) {
		try {
			await unlink(absolutePath);
		} catch (e) {
			console.error(e);
		}
	}

	async deleteS3File(cloudPath) {
		try {
			const s3Storage = new InstanceS3Storage(this.getInstanceRegistry());
			await s3Storage.delete(cloudPath);
		} catch (e) {
			console.error(e);
		}
	}

	async getFileByRow(importRow) {
		if (importRow.source_type === 'file') {
			const absolutePath = this.getAbsoluteFilePath(importRow.file_path);

			if (!fs.existsSync(absolutePath)) {
				await this.downloadFromS3(importRow.cloud_path, absolutePath);
			}

			return {
				fileName: importRow.file_name,
				filePath: absolutePath
			};
		}


		await this.importLogger.update({status: 'downloading'});
		const fileInfo = await this.downloadFile(importRow.url);
		let status = 'awaiting_setup';

		// check if cron import already configured
		if ((importRow.run === 'cron') && _.isObject(importRow.settings) && (Object.keys(importRow.settings).length !== 0)) {
			status = 'ready_for_import';
		}

		await this.importLogger.update({
			status,
			file_name: fileInfo.fileName,
			file_path: fileInfo.relativePath
		});

		return {
			fileName: fileInfo.fileName,
			filePath: fileInfo.absolutePath
		};
	}

	async downloadFromS3(cloudPath, localPath) {
		const dir = path.dirname(localPath);
		if (!fs.existsSync(dir)) {
			await mkdir(dir, {recursive: true});
		}
		const s3Storage = new InstanceS3Storage(this.getInstanceRegistry());

		await s3Storage.download(
			fs.createWriteStream(localPath, {flags: 'w'}),
			cloudPath
		);
	}

	downloadFile(url) {
		const downloader = new Downloader(this.instanceRegistry, 'import', {
			sizeLimit: 1e8
		});

		return downloader.downloadFile(url);
	}

	createParser(type, filePath, settings) {
		const ParserClass = (() => {
			switch (type) {
				case 'csv': return ProductImportParserCsv;
				case 'excel': return ProductImportParserExcel;
				case 'yml': return ProductImportParserYml;
				default: throw new Error('Unknown parser type');
			}
		})();

		const parser = new ParserClass(filePath, settings);

		return parser;
	}

	async saveRow(data) {
		if (Object.keys(data).length === 0) {
			return;
		}

		switch (this.defineEssence(data)) {
			case 'product': {
				const importProduct = new ImportProductEssence(this.instanceRegistry, this.importRow, this.importLogger, data);
				await importProduct.process();
				break;
			}
			case 'category': {
				const importCategory = new ImportCategoryEssence(this.instanceRegistry, this.importRow, this.importLogger);
				await importCategory.process(data);
				break;
			}
			default:
				return;
		}
	}

	defineEssence(data) {
		if (data['!essence']) {
			return data['!essence'];
		} else {
			return 'product';
		}
	}

	async loadImportRow() {
		const row = await this.db.model('productImport').findOne({
			where: {
				import_id: this.getImportId()
			}
		});

		this.setImportRow(row);

		return row;
	}

	getAbsoluteFilePath(filePath) {
		if (!path.isAbsolute(filePath)) {
			filePath = path.resolve(this.instanceRegistry.getDataPath(), filePath);
		}

		return filePath;
	}

	shouldImportImages() {
		return this.importLogger.areImagesAdded();
	}

	getImportLogId() {
		return this.importLogger.getLogId();
	}

	getImportLog() {
		return this.importLogger.getLogRow();
	}

	logSuccess() {
		return this.importLogger.update({
			status: 'success',
			completed_at: this.db.fn('NOW'),
			result: this.importLogger.getStats()
		});
	}

	async notifyImportResults() {
		await this.notifyStatus(TQueueEventType.created, ['created']);

		const updateStatuses = ['updated', 'appendVariant', 'updateVariant'];
		await this.notifyStatus(TQueueEventType.updated, updateStatuses);

		const eventPublisher = this.instanceRegistry.getEventPublisher();
		await eventPublisher.publish(TQueueEventType.importFinished, {import_log_id: this.importLogger.getLogId()});
	}

	async notifyStatus(status, logStatuses) {
		const rows = await this.db.model('productImportRel').findAll({
			where: {
				log_id: this.importLogger.getLogId(),
				product_id: {
					[Op.ne]: null
				},
				status: {
					[Op.in]: logStatuses
				}
			}
		});

		if (rows.length) {
			await productEvents.notifyProductsEvent(
				this.instanceRegistry,
				this.importRow.person_id,
				status,
				rows.map(el => el.product_id)
			);
		}
	}

	logImageImportStats({skipped, uploaded}) {
		this.importLogger.setImagesSkipped(skipped);
		this.importLogger.setImagesUploaded(uploaded);
	}

	async saveTask() {
		if (this.importRow.run !== 'cron') return;

		const [row] = await wrapperRegistry.getDb().model('task').findOrCreate({
			where: {
				local_id: this.importRow.import_id,
				instance_id: this.instanceRegistry.getInstanceInfo().instance_id,
				type: 'productImport'
			},
			defaults: {
				cron_rule: this.importRow.settings.cron_rule
			}
		});

		//@ts-ignore
		if (row.cron_rule !== this.importRow.settings.cron_rule) {
			await row.update({
				cron_rule: this.importRow.settings.cron_rule
			});
		}
	}
}