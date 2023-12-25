import BasicAdmin from '../admin';

export default class MailSettingsController extends BasicAdmin {
	async actionSettings() {
		const formKit = this.createFormKit('@p-system/forms/admin/mail', {});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		this.setPage('title', this.__('Email settings'));
		const data = await formKit.getWebForm();

		Object.assign(data, {
			buttons: {
				buttons: ['save']
			}
		});

		this.widget('system.emailSettingsForm.@c', {data});
	}

	async actionUploadLogo() {
		const formKit = this.createFormKit('@p-system/forms/admin/mail/logoUploader', {}, {
			beforeJson(result, closeModal, formKit) {
				//@ts-ignore
				return result.json.uploadedData = formKit.form.getUploadedImages()[0];
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			throw new Error('Method only for post!');
		}
	}

	async actionRmLogo() {
		const settings = await this.getSetting('mail', 'template');

		await this.setSetting('mail', 'template', Object.assign(settings, {logo: ''}));

		this.alertSuccess(this.__('Logo was successfully removed.'));
		this.json({});
	}
}