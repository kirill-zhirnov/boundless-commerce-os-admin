import BasicAdmin from '../../../system/controllers/admin';
import * as exporterFactory from '../../../../modules/dataProvider/exporterFactory';

export default class StockPerWarehouseController extends BasicAdmin {
	async actionIndex() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/stockPerWarehouse');
		await dataProvider.validate();
		const data = await dataProvider.getTplData();

		this.setPage({
			title: this.__('Stock per warehouse')
		});

		this.widget('inventory.stockPerWarehouseGrid.@c', {data});
	}

	async actionCollection() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/stockPerWarehouse');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionExport() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/stockPerWarehouse', {}, this.getParam('grid'));
		const widget = '@p-inventory/widgets/export/stockPerWarehouseGrid';

		//@ts-ignore
		const exporter = exporterFactory.make(this.getParam('export'), this, widget, dataProvider);

		//@ts-ignore
		await exporter.setup();
		//@ts-ignore
		await exporter.run();
	}
}