import BasicAdmin from '../../../../system/controllers/admin';
import * as exporterFactory from '../../../../../modules/dataProvider/exporterFactory';

export default class ChangeQtyController extends BasicAdmin {
	init() {
		super.init();

		return this.grid = '@p-inventory/dataProvider/admin/changeQty';
	}

	async actionIndex() {
		const dataProvider = await this.createDataProvider(this.grid);
		const data = await dataProvider.getTplData();

		this.setPage('title', this.__('History of changes in stock qty'));

		this.widget('inventory.changeQtyGrid.@c', {data});
	}

	async actionCollection() {
		const dataProvider = await this.createDataProvider(this.grid);
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionForm() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/movementItem', {
			pk: this.getParam('pk')
		});

		const data = await dataProvider.getTplData();
		const out = {
			grid: data,
			buttons: {
				buttons: ['cancel'],
				predefinedButtons: {
					cancel: {
						title: this.__('Close')
					}
				}
			}
		};

		this.modal('form', out, this.__('Movement info'));
	}

	async actionMovementInfoCollection() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/movementItem');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionExport() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/changeQty', {}, this.getParam('grid'));
		const widget = '@p-inventory/widgets/export/changeQtyGrid';

		const exporter = exporterFactory.make(this.getParam('export'), this, widget, dataProvider);
		await exporter.setup();

		await exporter.run();
	}
}