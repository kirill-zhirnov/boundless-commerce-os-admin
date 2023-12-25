import FormWidget from '../../../modules/widget/form.client';
import ajax from '../../../modules/ajax/kit.client';
import DropzoneWrapper from '../../cms/widgets/dropzoneWrapper.client';

export default class AdminManufacturerLogo extends FormWidget {
	run() {
		return this.render('adminManufacturerLogo');
	}

	attributes() {
		return Object.assign(super.attributes(), {
			class: 'manufacturer-logo-form',
			name: 'logo'
		});
	}

	runLazyInit() {
		this.dropZone = new DropzoneWrapper(
			this.$('.dropzone-uploader').get(0),
			this.url('catalog/admin/manufacturerImage/upload', {manufacturerId: this.data.pk}),
			{
				successMessage: this.__('Logo was successfully installed'),
				onSuccessHook: (file, response) => {
					return this.setImage(response.d.uploadedData);
				}
			}
		);
	}

	events() {
		return {
			'click .rm': 'onRemoveClicked'
		};
	}

	setImage(img) {
		this.$('.logo-wrapper .img').css('background-image', `url(${img.smallThumb.src})`);

		this.$('.logo-wrapper').show();
		this.$('.nologo').hide();

		return this.data.logo = img;
	}

	async onRemoveClicked(e) {
		e.preventDefault();

		if (!confirm(this.__('Are you sure?'))) {
			return;
		}

		await ajax.get(this.url('catalog/admin/manufacturerImage/rm'), {id: this.data.pk});
		this.$('.logo-wrapper .img').css('background-image', 'none');
		this.$('.logo-wrapper').hide();
		this.$('.nologo').show();
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