import FormWidget from '../../../modules/widget/form.client';
import $ from 'jquery';
import * as bundles from '../../../modules/utils/bundles.client';

const templateGroup = '.template-group';
const subjectGroup = '.subject-group';
const statusIdGroup = '.status-id-group';

export default class EmailNotificationForm extends FormWidget {
	constructor(options) {
		super(options);

		this.codeMirror = null;
	}

	attributes() {
		return Object.assign(super.attributes(), {
			class: 'email-notification-form',
			action: this.url('orders/admin/setup/notification/form')
		});
	}

	run() {
		return this.render('emailNotificationForm');
	}

	runLazyInit() {
		bundles.load('adminUI').then(() => {
			const CodeMirror = require('codemirror');
			require('codemirror/addon/mode/simple');
			require('codemirror/mode/handlebars/handlebars');
			require('codemirror/mode/htmlmixed/htmlmixed');

			const [templateTextarea] = this.$('.status-template .template');
			this.codeMirror = CodeMirror.fromTextArea(templateTextarea, {
				mode: {name: 'handlebars', base: 'text/html'},
				lineWrapping: true,
				viewportMargin: Infinity
			});
			this.codeMirror.on('change', () => {
				this.codeMirror.save();
			});

			this.checkFieldsVisibility();
		});
	}

	events() {
		return Object.assign(super.events(), {
			'change [name="event_type"]': (e) => {
				this.checkFieldsVisibility();
				this.updateTplByStatus();
			},
			'change [name="status_id"]': (e) => {
				this.checkFieldsVisibility();
				this.updateTplByStatus();

				// if (!this.codeMirror) return;

				// const statusId = $(e.currentTarget).val();
				// const templates = this.data?.options?.template || {};
				//
				// const template = statusId
				// 	? templates[statusId in templates ? statusId : 'default'].template
				// 	: '';
				// const subject = statusId
				// 	? templates[statusId in templates ? statusId : 'default'].subject
				// 	: '';
				//
				// this.$('input[name="subject"]').val(subject);
				// this.codeMirror.setValue(template);
			}
		});
	}

	updateTplByStatus() {
		const eventType = this.$('[name="event_type"]:checked').val();
		const statusId = this.$('[name="status_id"]').val();

		const templates = this.data?.options?.template;
		if (!templates || !this.codeMirror) {
			return;
		}

		let subject, template;
		if (eventType === 'created') {
			subject = templates.created.subject;
			template = templates.created.template;
		} else if (eventType === 'updated') {
			if (statusId in templates.updated) {
				subject = templates.updated[statusId].subject;
				template = templates.updated[statusId].template;
			}
		}

		if (subject && template) {
			this.$('input[name="subject"]').val(subject);
			this.codeMirror.setValue(template);
		}
	}

	checkFieldsVisibility() {
		const eventType = this.$('[name="event_type"]:checked').val();
		const statusId = this.$('[name="status_id"]').val();

		[statusIdGroup, subjectGroup, templateGroup].forEach((selector) => this.$(selector).hide());
		if (eventType === 'created') {
			[subjectGroup, templateGroup].forEach((selector) => this.$(selector).show());
		} else if (eventType === 'updated') {
			$(statusIdGroup).show();

			if (statusId) {
				[subjectGroup, templateGroup].forEach((selector) => this.$(selector).show());
			}
		}
	}

	remove() {
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
			this.codeMirror = null;
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}