import Widget from '../../../modules/widget/widget.client';
import DropzoneWrapper from '../../cms/widgets/dropzoneWrapper.client';
import ajax from '../../../modules/ajax/kit.client';
import $ from 'jquery';

const tpl = 'organizationImages';

export default class OrganizationImages extends Widget {
	attributes() {
		return {
			class: 'organization-imgs'
		};
	}

	events() {
		return {
			'click .rm': (e) => {
				e.preventDefault();

				ajax.post(['system/admin/schemaOrg/rmOrgImg', {index: $(e.currentTarget).data('index')}])
					.then((images) => {
						this.data.images = images;
						this.reRender();
					});
			}
		};
	}

	run() {
		return this.render(tpl);
	}

	runLazyInit() {
		this.setupClientSide();
	}

	setupClientSide() {
		this.dropZone = new DropzoneWrapper(
			this.$('.dropzone-uploader').get(0),
			this.url('system/admin/schemaOrg/uploadOrgImg'), {
				onSuccessHook: (file, response) => {
					this.data.images = response.d.images;

					this.reRender();
				}
			}
		);
	}

	reRender() {
		this.renderToWrapper(tpl)
			.then(() => this.setupClientSide());
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