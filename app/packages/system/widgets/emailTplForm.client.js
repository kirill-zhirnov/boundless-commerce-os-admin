import FormWidget from '../../../modules/widget/form.client';
import * as bundles from '../../../modules/utils/bundles.client';
import $ from 'jquery';

export default class EmailTplForm extends FormWidget {
	constructor(options) {
		super(options);

		this.codeMirrors = [];
	}

	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('system/admin/emailTpls/form')
		});
	}

	run() {
		return this.render('emailTplForm');
	}

	runLazyInit() {
		bundles.load('adminUI').then(() => {
			setTimeout(() => this.activateCM(), 200);
		});
	}

	activateCM() {
		const CodeMirror = require('codemirror');
		require('codemirror/addon/mode/simple');
		require('codemirror/mode/handlebars/handlebars');
		require('codemirror/mode/htmlmixed/htmlmixed');

		this.$('.cm-editor').each((key, el) => {
			const codeMirror = CodeMirror.fromTextArea(el, {
				mode: {name: 'handlebars', base: 'text/html'},
				// lineWrapping: true,
				// viewportMargin: Infinity
			});
			codeMirror.on('change', () => codeMirror.save());

			if ($(el).data('cmClass')) {
				$(codeMirror.display.wrapper).addClass($(el).data('cmClass'));
			}

			this.codeMirrors.push(codeMirror);
		});
	}

	remove() {
		if (Array.isArray(this.codeMirrors)) {
			for (const codeMirror of this.codeMirrors) {
				codeMirror.toTextArea();
			}

			this.codeMirrors = [];
		}

		super.remove();
	}

	getFileName() {
		return __filename;
	}
}