import GridResource from '../../../../modules/controller/resources/grid';

export default class FeedsController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'catalog.feedsGrid.@c',
			provider: '@p-catalog/dataProvider/admin/feeds',
			// form: '@p-catalog/forms/label',
			model: 'feeds'
		};
	}

	async actionIndex() {
		this.setPage({
			title: this.__('Data feeds')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/feedForm', {},{
			successRedirect: ['catalog/admin/feeds/index', this.getParam('grid')]
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			Object.assign(data, {
				grid: this.getParam('grid')
			});

			//@ts-ignore
			const title = (data.scenario === 'update') ? this.__('Edit feed "%s"', [data.attrs.title]) : this.__('Create new feed');
			this.setPage({title});

			this.render('form', {data});
		}
	}
}