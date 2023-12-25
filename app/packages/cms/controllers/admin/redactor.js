const pathAlias = require('path-alias');
const BasicAdmin = pathAlias('@basicAdmin');

class RedactorController extends BasicAdmin {
	postActionImageUpload() {
		let formKit = this.createFormKit('@p-cms/forms/admin/imageUploader', {
			essence: 'wysiwyg'
		}, {
			success: () => {
				let out = {};
				formKit.form.getUploadedImages().forEach((img, i) => {
					out[`file-${(i+1)}`] = {
						url: img.original.src,
						id: img.image_id
					};
				});

				this.getResponse().setPerformWithExpress(false);
				this.getFrontController().getResponse().json(out);
				this.resolve();
			},

			error: () => {
				this.getResponse().setPerformWithExpress(false);

				this.getFrontController().getResponse().json({
					"error": true,
					"message": formKit.form.getSingleError()
				});

				this.resolve();
			}
		});

		formKit.process();
	}

	async actionImages() {
		let dataProvider = await this.createDataProvider('@p-cms/dataProvider/admin/image', {}, {
			usedIn: 'wysiwyg',
			perPage: 0
		});

		let data = await dataProvider.getData(),
			out = []
		;

		for (let img of data[1]) {
			out.push({
				id: img.image_id,
				title: img.name,
				thumb: img.smallThumb.src,
				url: img.original.src
			});
		}

		this.getResponse().setPerformWithExpress(false);
		this.getFrontController().getResponse().json(out);
		this.resolve();
	}
}

module.exports = RedactorController;