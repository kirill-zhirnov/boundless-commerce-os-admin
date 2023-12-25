import BasicAdmin from '../../../../system/controllers/admin';

export default class UploadController extends BasicAdmin {
	async postActionTplImage() {
		const formKit = this.createFormKit('@p-catalog/forms/category/tplImage', {}, {
			success: (attrs, pk, formKit) => {
				const out =
					{files: formKit.form.getFilesForWeb()};

				this.getResponse().setPerformWithExpress(false);
				const expressRes = this.getFrontController().getResponse();

				expressRes.json(out);
			}
		});

		await formKit.process();
	}

	// async postActionDataUrl() {
	// 	const formKit = this.createFormKit('@p-theme/forms/admin/upload/imageDataUrl', {}, {
	// 		successMsg: false,
	// 		beforeJson: (result) => {
	// 			//@ts-ignore
	// 			return result.json.image = formKit.form.getWebImg();
	// 		}
	// 	});

	// 	await formKit.process();
	// }
}