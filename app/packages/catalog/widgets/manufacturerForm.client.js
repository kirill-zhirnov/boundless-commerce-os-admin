import FormsGroup from '../../../modules/widget/formsGroup.client';

export default class ManufacturerForm extends FormsGroup {
	attributes() {
		return {
			'data-form-group': this.url('catalog/admin/manufacturer/form')
		};
	}

	async run() {
		return this.render('manufacturerForm');
	}

	runLazyInit() {
		this.$('textarea[data-visual-editor]').wysiwyg({config: {toolbarFixedTopOffset: 90}});
	}

	remove() {
		this.$('textarea[data-visual-editor]').wysiwyg('rm');
		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}