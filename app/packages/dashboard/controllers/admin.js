import BasicAdminController from '../../system/controllers/admin';

export default class DashboardAdminController extends BasicAdminController {
	async actionIndex() {
		const roles = this.getUser().getRoles();
		if (!roles.includes('admin')) {
			if (roles.includes('orders-manager')) {
				this.redirect(['orders/admin/orders/index']);
				return;
			} else if (roles.includes('content-manager')) {
				this.redirect(['catalog/admin/product/index']);
				return;
			} else {
				throw new Error('Cant find redirect for non-admin role;');
			}
		}

		const [productsCountRow] = await this.getDb().sql(`
			select
				count(*) as num
			from
				product
			where
				deleted_at is null
				and status = 'published'
		`);

		this.setPage('title', this.__('Dashboard'));
		this.render('index', {
			dbCleanUps: await this.getSetting('system', 'cleanUp'),
			productsCounted: parseInt(productsCountRow.num)
		});
	}

	async actionSalesOverTime() {
		const formKit = this.createFormKit('@p-dashboard/forms/admin/salesOverTime', {
			isSubmitted: this.isPostMethod()
		});

		try {
			await formKit.validate();
			const form = await formKit.getForm();
			//@ts-ignore
			const data = await form.getChartData();
			this.json(data);

		} catch (e) {
			if (e instanceof Error) {
				throw e;
			}

			const form = await formKit.getForm();
			await this.jsonErrors({errors: form.getFormErrors()});
		}
	}
}
