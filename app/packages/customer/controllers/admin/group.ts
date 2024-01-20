import GridResource from '../../../../modules/controller/resources/grid';

export default class CustomerGroupController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'customer.customerGroupGrid.@c',
			provider: '@p-customer/dataProvider/admin/customerGroup',
			model: 'customerGroup',
		});
	}

	async actionIndex() {
		this.setPage({
			title: this.__('Customer Groups')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-customer/forms/admin/group', {}, {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Add custom attribute') : this.__('Edit custom attribute');
			this.modal('form', {data}, title);
		}
	}
}