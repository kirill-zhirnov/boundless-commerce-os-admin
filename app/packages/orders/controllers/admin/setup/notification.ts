import BasicAdmin from '../../../../system/controllers/admin';

export default class EmailNotificationsController extends BasicAdmin {
	async actionSettings() {
		const formKit = this.createFormKit('@p-orders/forms/notification/settings');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			// const data = await formKit.getWebForm();

			this.setPage('title', this.__('Order Email Notifications'));
			this.widget('system.vueApp.@c', {
				data: {
					app: 'orders/form/emailNotification',
					props: {}
				}
			});
		}
	}

	async actionList() {
		const transport = 'email';
		const data = await this.getDb().sql(`
			select
				order_status.alias,
				order_status.status_id,
				order_status.background_color,
				order_status_text.title as status_title,
				notification_template.template,
				notification_template.template_id,
				notification_template.subject,
				notification_template.event_type
			from
				notification_template
				left join order_status using(status_id)
				left join order_status_text using(status_id)
			where
				notification_template.transport = :transport
				and (
					(
						order_status.deleted_at is null
						and order_status_text.lang_id = :lang
					)
					or order_status.status_id is null
				)
			order by
				order_status.sort nulls first
		`, {
			transport,
			lang: this.getEditingLang().lang_id
		});

		this.json(data);
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/notification/form');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			Object.assign(data, {
				buttons: {
					predefinedButtons: {
						save:
						{
							title: this.__('Create')
						}
					},
					buttons: ['save']
				}
			});

			this.modal('form', {data}, this.__('Create new email notification'));
		}
	}

	async actionRm() {
		const id = parseInt(this.getParam('id'));
		if (!id) return;

		await this.getDb().sql(`
			delete from
				notification_template
			where
				template_id = :id
		`, {id});

		this.json({});
	}
}