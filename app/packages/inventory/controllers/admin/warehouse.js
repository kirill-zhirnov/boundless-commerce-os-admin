import GridResource from '../../../../modules/controller/resources/grid';

export default class WarehouseController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'inventory.warehouseGrid.@c',
			provider: '@p-inventory/dataProvider/admin/warehouse',
			model: 'warehouse',
			form: '@p-inventory/forms/warehouse'
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Warehouses')
		});

		return super.actionIndex();
	}
}