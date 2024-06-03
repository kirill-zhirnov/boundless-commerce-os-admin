import GridResource from '../../../../modules/controller/resources/grid';

export default class EmailTplsController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'system.emailTplsGrid.@c',
			provider: '@p-system/dataProvider/admin/emailTpls',
			model: 'emailTpl',
		});
	}

	actionIndex() {
		this.setPage({
			title: this.__('Email Templates')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-system/forms/admin/emailTpl', {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			const title = this.__('Edit template "%s"', [data.row.title]);

			this.modal('form', {data}, title, null, {
				setSize: 'large'
			});
		}
	}
}