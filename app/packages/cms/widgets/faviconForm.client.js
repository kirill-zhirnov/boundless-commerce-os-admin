import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';
import DropzoneWrapper from './dropzoneWrapper.client';
import $ from 'jquery';

export default class FaviconForm extends FormWidget {
	run() {
		return this.render('faviconForm');
	}

	attributes() {
		return _.extend(super.attributes(), {
			class: 'theme-favicon-form',
			name: 'favicon'
		});
	}

	runLazyInit() {
		return this.setupDropZone();
	}

	setupDropZone() {
		return this.dropZone = new DropzoneWrapper(this.$('.dropzone-uploader').get(0), this.url('cms/admin/favicon/upload'), {
			acceptedFiles: '.png,.jpg,.jpeg',
			successMessage: this.__('Favicon was successfully installed'),
			onSuccessHook: (file, response) => {
				return this.setImage(response.d.uploadedData);
			}
		});
	}

	setImage(imgSrc) {
		this.$('.favicon-form .img').css('background-image', `url(${imgSrc})`);

		let $tag = $('head link[type=\'image/x-icon\']');

		if ($tag.length === 0) {
			$tag = $('<link rel="shortcut icon" type="image/x-icon">');
			$tag.appendTo('head');
		}

		$tag.attr('href', imgSrc);

		if (!this.data.favicon) {
			this.$('.favicon-form .img').show();
			this.$('.favicon-form .nofavicon').hide();

			return this.data.favicon = imgSrc;
		}
	}

	remove() {
		if (this.dropZone) {
			this.dropZone.remove();
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}