import BasicAdmin from '../admin';

export default class SiteController extends BasicAdmin {
	async actionLocale() {
		const formKit = this.createFormKit('@p-system/forms/admin/locale', {}, {
			beforeJson: () => {
				this.metaLocationRedirect(this.url('system/admin/site/locale'));
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		this.setPage('title', this.__('Locale'));
		const data = await formKit.getWebForm();
		this.widget('system.vueApp.@c', {
			data: {
				app: 'system/admin/locale',
				props: {
					form: data
				}
			}
		});
	}
}