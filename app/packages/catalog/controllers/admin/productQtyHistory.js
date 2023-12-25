import BasicAdmin from '../../../system/controllers/admin';
import * as exporterFactory from '../../../../modules/dataProvider/exporterFactory';

export default class ProductQtyHistoryController extends BasicAdmin {
	constructor() {
		//@ts-ignore
		super(...arguments);

		this.grid = '@p-catalog/dataProvider/admin/productQtyHistory';
	}

	async actionModal() {
		const dataProvider = await this.createDataProvider(this.grid);
		const data = await dataProvider.getTplData();

		this.modal('modal', {data}, this.__('History of changes in stock qty'), null, {
			setSize: 'large'
		});
	}

	async actionCollection() {
		const dataProvider = await this.createDataProvider(this.grid);
		const data = await dataProvider.getData();

		return this.json(data);
	}

	async actionExport() {
		const dataProvider = await this.createDataProvider(this.grid, {}, this.getParam('grid'));
		const widget = '@p-inventory/widgets/export/changeQtyGrid';
		const exporter = exporterFactory.make(this.getParam('export'), this, widget, dataProvider);

		await exporter.setup();
		await exporter.run();
	}
}