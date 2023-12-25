import GridResource from '../../../../modules/controller/resources/grid';

export default class WebhookSettingsController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'system.webhookGrid.@c',
			provider: '@p-system/dataProvider/admin/webhook',
			form: '@p-system/forms/admin/webhook',
		});
	}

	actionIndex() {
		this.setPage({
			title: this.__('Webhooks')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-system/forms/admin/webhook', {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario === 'update')
				? this.__('Edit webhook')
				: this.__('Create a webhook');

			Object.assign(data, {
				buttons: {
					predefinedButtons: {
						save:
						{
							title: data.scenario === 'update'
								? this.__('Save')
								: this.__('Create'),
						}
					},
					buttons: ['save']
				}
			});

			this.modal('form', {data}, title);
		}
	}

	async actionBulkRm() {
		const id = this.getParam('id');
		if (!Array.isArray(id)) {
			this.rejectHttpError(400, 'Bad request');
			return;
		}

		await this.getDb().sql(`
			delete from webhook
			where
				webhook_id in (:id)
		`, {id});

		this.alertSuccess(this.__('Selected items were successfully removed.'));

		this.json({});
	}
}
