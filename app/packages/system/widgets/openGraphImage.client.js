import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';
import DropzoneWrapper from '../../cms/widgets/dropzoneWrapper.client';

export default class OpenGraphImageForm extends FormWidget {
	run() {
		return this.render('openGraphImage');
	}

	attributes() {
		return _.extend(super.attributes(), {
			name: 'openGraph'
		});
	}

	runLazyInit() {
		this.setupDropZone();
	}

	setupDropZone() {
		this.dropZone = new DropzoneWrapper(this.$('.dropzone-uploader').get(0), this.url('system/admin/cms/openGraphUpload'), {
			successMessage: this.getI18n().__('Image was successfully installed'),
			onSuccessHook: (file, response) => {
				return this.setImage(response.d.uploadedData.www);
			}
		});
	}

	setImage(imgSrc) {
		this.$('.open-graph-form .img').css('background-image', `url(${imgSrc})`);

		this.$('.open-graph-form .img').show();
		this.$('.open-graph-form .noimg').hide();

		return this.data.img = imgSrc;
	}

	remove() {
		if (this.dropZone) {
			this.dropZone.remove();
			this.dropZone = null;
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}
