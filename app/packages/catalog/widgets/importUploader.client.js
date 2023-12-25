import Widget from '../../../modules/widget/widget.client';
// import utils from '../../../modules/utils/common.client';
import _ from 'underscore';
import modalKit from '../../../modules/modal/kit.client';
import DropzoneWrapper from '../../cms/widgets/dropzoneWrapper.client';

export default class ImportCsvUploader extends Widget {
	run() {
		return this.render('importUploader');
	}

	runLazyInit() {
		return this.setupDropZone();
	}

	setupDropZone() {
		const acceptedFiles = [
			'.xls',
			'.xlsx',
			'.csv',
			// '.xml',
			// '.yml'
		];

		this.dropZone = new DropzoneWrapper(this.$('.dropzone-uploader').get(0), this.url('catalog/admin/import/upload'), {
			dictDefaultMessage: this.__('Drop CSV or Excel file here to upload or click to select.'),
			acceptedFiles: acceptedFiles.join(','),
			successMessage: false,
			onSuccessHook: (file, response) => {
				let meta;
				if (_.isObject(response) && 'm' in response && 'd' in response) {
					meta = response.m;
				}

				if (meta && 'action' in meta) {
					switch (meta.action) {
						case 'modalRedirect':
							return modalKit.createRemote(meta.data);
						case 'redirect':
							return this.getClientRegistry().getClientNav().url(meta.data);
					}
				}
			}
		});
	}

	getFileName() {
		return __filename;
	}

	remove() {
		if (this.dropZone) {
			this.dropZone.remove();
			this.dropZone = null;
		}

		return super.remove();
	}
}