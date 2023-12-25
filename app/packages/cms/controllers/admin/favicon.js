import BasicAdmin from '../../../system/controllers/admin';

export default class FaviconController extends BasicAdmin {
	postActionUpload() {
		const formKit = this.createFormKit('@p-cms/forms/admin/upload/favicon', {}, {
			beforeJson: (result, closeModal, formKit) => {
				//@ts-ignore
				const favicon = formKit.form.savedValue['android-chrome-192x192.png'];
				//@ts-ignore
				result.json.uploadedData = this.getInstanceRegistry().getMediaUrl(favicon);
			}
		});

		return formKit.process();
	}
}