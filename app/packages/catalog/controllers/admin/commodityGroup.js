import GridResource from '../../../../modules/controller/resources/grid';

export default class CommodityGroupController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'catalog.commodityGroupGrid.@c',
			provider: '@p-catalog/dataProvider/admin/commodityGroup',
			model: 'commodityGroup',
			form: '@p-catalog/forms/commodityGroup',
			essence: 'commodityGroup'
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Product Types')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const group = this.createFormsGroup({
			group: {
				form: '@p-catalog/forms/commodityGroup'
			}
		}, {
			successRedirect: ['catalog/admin/commodityGroup/index', this.getParam('grid')]
		});

		this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/commodityGroup/index'));

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();
			//@ts-ignore
			const title = data.forms?.group?.scenario === 'insert'
				? this.__('Create Product Type')
				//@ts-ignore
				: this.__('Edit Product Type "%s"', [data.forms.group.attrs.title]);

			//@ts-ignore
			data.grid = this.getParam('grid');

			this.setPage('title', title);
			this.render('form', data);
		}
	}

	postActionQuickEdit() {
		const formKit = this.createFormKit('@p-catalog/forms/commodityGroup/quickEdit', {}, {
			successMsg: false,
			beforeJson: (result) => {
				//@ts-ignore
				const options = formKit.form.groupOptions;

				if (this.getParam('createOption') === '1') {
					options.push(['create', this.getI18n().__('+ Create new Product Type')]);
				}

				//@ts-ignore
				result.json.options = options;
			}

		});
		return formKit.process();
	}
}