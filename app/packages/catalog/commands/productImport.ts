import BasicCommand from '../../../modules/commands/basic';
import ProductImporter from '../components/productImporter';
import ProductImageImporter from '../components/productImageImporter';
import {bootstrapInstanceById} from '../../../modules/bootstrap/instance';

export default class ProductImportCommand extends BasicCommand {
	async actionRun() {
		const importer = await this.getImporter();
		await this.startImport(importer);
	}

	async actionDownload() {
		const importer = await this.getImporter();
		await importer.download();
		const importRow = await importer.getImportRow();
		if ((importRow.type === 'yml') && (importer.getImportLog().status === 'ready_for_import')) {
			if (importRow.run === 'once') {
				await this.startImport(importer);
			} else if (importRow.run === 'cron') {
				await importer.saveTask();
			}
		}
	}

	protected async startImport(importer: ProductImporter) {
		try {
			await importer.run();
			if (importer.shouldImportImages()) {
				await this.startImageImport(importer);
			}
		} catch (e) {
			console.error(e);
		} finally {
			await importer.finishImport();
		}
	}

	protected async startImageImport(productImporter: ProductImporter) {
		const imageImporter = new ProductImageImporter(productImporter.getInstanceRegistry(), productImporter.getImportId());

		await imageImporter.run();
		productImporter.logImageImportStats(imageImporter.getImportStats());
	}

	protected async getImporter() {
		const instanceId = this.getOption('instanceId') as unknown as number;
		const importId = this.getOption('importId') as unknown as number;

		if (!instanceId || !importId) {
			throw new Error('You should specify instance id and import id');
		}

		const instanceRegistry = await bootstrapInstanceById(instanceId);
		const importer = new ProductImporter(instanceRegistry, importId);

		return importer;
	}
}