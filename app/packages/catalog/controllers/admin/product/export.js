import BasicAdmin from '../../../../system/controllers/admin';
import * as exporterFactory from '../../../../../modules/dataProvider/exporterFactory';

export default class ProductExportController extends BasicAdmin {
	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/product/export', {
			grid: this.getParam('grid'),
			export: this.getParam('export')
		}, {
			successMsg: false,
			beforeJson: () => {
				//@ts-ignore
				this.metaLocationRedirect(formKit.form.getDownloadRedirect());
			},
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.modal('form', {data}, this.__('Export settings'), null, {});
		}
	}

	async actionDownloadProducts() {
		const dataProvider = await this.createDataProvider(
			'@p-catalog/dataProvider/admin/product',
			{isExport: true},
			this.getParam('grid')
		);

		const exporter = exporterFactory.make(
			this.getParam('export'), this, '@p-catalog/widgets/export/productGrid', dataProvider
		);

		await exporter.setup();
		await exporter.run();
	}

	async actionDownloadProductsAndVariants() {
		const dataProvider = await this.createDataProvider(
			'@p-catalog/dataProvider/admin/product/inventoryItem',
			{isExport: true},
			this.getParam('grid')
		);

		const exporter = exporterFactory.make(
			this.getParam('export'), this, '@p-catalog/widgets/export/productItemGrid', dataProvider
		);

		await exporter.setup();
		await exporter.run();
	}

	// async actionTest() {
	// 	const dataProvider = await this.createDataProvider(
	// 		'@p-catalog/dataProvider/admin/product/inventoryItem',
	// 		{isExport: true},
	// 		this.getParam('grid')
	// 	);
	//
	// 	this.json(await dataProvider.getData());
	// }

	// async actionExport() {
	// 	const dataProvider = await this.createDataProvider(this.grid.provider, {isExport: true}, this.getParam('grid'));
	// 	const widget = this.grid.exporterWidget ? this.grid.exporterWidget : this.grid.widget;
	//
	// 	const exporter = exporterFactory.make(this.getParam('export'), this, widget, dataProvider);
	//
	// 	await exporter.setup();
	// 	await exporter.run();
	// }
}