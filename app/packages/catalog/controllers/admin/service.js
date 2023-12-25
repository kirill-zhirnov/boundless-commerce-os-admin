import GridResource from '../../../../modules/controller/resources/grid';

export default class ServiceController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		return this.grid = {
			widget: 'catalog.serviceGrid.@c',
			provider: '@p-catalog/dataProvider/admin/service',
			model: 'service',
			form: {
				path: '@p-catalog/forms/service',
				settings: {
					setSize: 'small'
				}
			}
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Services')
		});

		return super.actionIndex();
	}
}