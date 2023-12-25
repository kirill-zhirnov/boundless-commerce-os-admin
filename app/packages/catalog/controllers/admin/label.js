import GridResource from '../../../../modules/controller/resources/grid';

export default class LabelController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'catalog.labelGrid.@c',
			provider: '@p-catalog/dataProvider/admin/label',
			form: '@p-catalog/forms/label',
			model: 'label'
		};
	}

	actionIndex() {
		this.setPage({
			title: this.getI18n().__('Labels')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/label', {}, {
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			data.grid = this.getParam('grid');

			//@ts-ignore
			data.buttons = data.buttons || {};
			//@ts-ignore
			data.buttons.buttons = ['save'];

			const title = data.pk != null
				//@ts-ignore
				? this.getI18n().__('Edit label') + ` "${data.attrs.title}" `
				: this.getI18n().__('Create new label');

			this.modal('form', {data}, title);
		}
	}

	async actionRmFromProducts() {
		const labelId = this.getParam('labelId');

		if ((labelId == null)) {
			this.alertDanger(this.getI18n().__('Label id is not specified'));
			this.json({status: 'error'});
		}

		//@ts-ignore
		await this.getDb().model('productLabelRel').rmFromProducts(labelId);
		this.alertSuccess(this.getI18n().__('Successfully removed from products'));
		this.json({status: 'success'});
	}
}