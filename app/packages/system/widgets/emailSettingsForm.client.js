import FormWidget from '../../../modules/widget/form.client';
import DropzoneWrapper from '../../cms/widgets/dropzoneWrapper.client';
import ajax from '../../../modules/ajax/kit.client';
import {getImgCloudUrl} from '../../../modules/s3Storage/cloudUrl';

export default class EmailSettingsForm extends FormWidget {
	constructor(options) {
		super(options);

		this.$editor = null;
		this.dropZone = null;
	}

	run() {
		return this.render('emailSettingsForm');
	}

	attributes() {
		return Object.assign(super.attributes(), {
			class: 'email-settings-form',
			name: 'logo',
			action: this.url('system/admin/mail/settings')
		});
	}

	runLazyInit() {
		if (this.data?.attrs?.logo) {
			const newPath = getImgCloudUrl(this.data.attrs.logo, 200);
			this.showImage(newPath);
		}
		this.setupVisualEditor();
		this.setupDropZone();
	}

	events() {
		return Object.assign(super.events(),
			{
				'click .rm': 'onRemoveClicked'
			});
	}

	setupDropZone() {
		return this.dropZone = new DropzoneWrapper(
			this.$('.dropzone-uploader').get(0),
			this.url('system/admin/mail/uploadLogo'),
			{
				acceptedFiles: '.png,.jpg,.jpeg',
				successMessage: this.__('Logo was successfully installed'),
				onSuccessHook: (file, response) => {
					return this.showImage(getImgCloudUrl(response.d.uploadedData, 200));
				}
			});
	}

	setupVisualEditor() {
		//@ts-ignore
		this.$editor = this.$('textarea[data-visual-editor]').wysiwyg({
			toolbar: 'light',
			config: {
				minHeight: 100,
				maxHeight: 100,
			},
		});
	}

	showImage(path) {
		this.$('.logo-wrapper .img').css('background-image', `url(${path})`);
		this.$('.logo-wrapper').show();
		this.$('.nologo').hide();

		this.data.logo = path;
	}

	hideImage() {
		this.$('.logo-wrapper .img').css('background-image', 'none');
		this.$('.logo-wrapper').hide();
		this.$('.nologo').show();

		this.data.logo = null;
	}

	async onRemoveClicked(e) {
		e.preventDefault();

		if (!confirm(this.__('Are you sure?'))) {
			return;
		}

		await ajax.get(this.url('system/admin/mail/rmLogo'));
		this.hideImage();
	}

	remove() {
		if (this.dropZone) {
			this.dropZone.remove();
		}
		if (this.$editor) {
			this.$editor.wysiwyg('rm');
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}