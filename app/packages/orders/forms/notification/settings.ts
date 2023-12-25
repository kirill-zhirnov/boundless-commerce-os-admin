import Form from '../../../../modules/form/index';
import * as mustacheCompiler from '../../../system/modules/mustacheCompiler';
import NotificationEditForm from './form';

interface IAttrs {
	templates: {[key: number]: string}
	subjects: {[key: number]: string}
}

export default class NotificationSettingsForm extends Form<IAttrs> {
	protected transport: string = 'email';

	getRules() {
		return [
			['templates, subjects', 'required'],
			['templates', 'validateTemplates'],
			['subjects', 'validateSubjects'],
		];
	}

	// async getTemplates() {
	// 	return this.getDb().sql(`
	// 		select
	// 			order_status.alias,
	// 			order_status.status_id,
	// 			order_status.background_color,
	// 			order_status_text.title,
	// 			notification_template.template,
	// 			notification_template.template_id,
	// 			notification_template.subject
	// 		from
	// 			notification_template
	// 		inner join order_status using(status_id)
	// 		inner join order_status_text using(status_id)
	// 		where
	// 			notification_template.transport = :transport
	// 			and order_status.deleted_at is null
	// 			and order_status_text.lang_id = :lang
	// 		order by order_status.sort
	// 	`, {
	// 		transport: this.transport,
	// 		lang: this.getEditingLang().lang_id
	// 	});
	// }

	async save() {
		const {templates, subjects} = this.getSafeAttrs();

		for (const [templateId, template] of Object.entries(templates)) {
			await this.getDb().sql(`
				update
					notification_template
				set
					subject = :subject,
					template = :template
				where
					template_id = :id
					and transport = :transport
			`, {
				transport: this.transport,
				id: parseInt(templateId),
				subject: subjects[templateId] || '',
				template: template
			});
		}
	}

	async validateTemplates(templates: {[key: number]: string}, options: any, field: string) {
		if (!templates || !Object.keys(templates).length) {
			this.addError(field, 'emptyTemplates', this.__('At least one template should be edited.'));
			return;
		}

		for (const [templateId, template] of Object.entries(templates)) {
			try {
				mustacheCompiler.vmCompile(template || '', NotificationEditForm.getFakeData(this.getClientRegistry().getLocale()));
			} catch (e) {
				this.addError(`templates[${templateId}]`, 'notValidTemplate', this.__('Template has incorrect syntax.'));
			}
		}

		return true;
	}

	async validateSubjects(subjects: {[key: number]: string}, options: any, field: string) {
		if (!subjects || !Object.keys(subjects).length) {
			this.addError(field, 'emptySubjects', this.__('At least one subject should be edited.'));
			return;
		}

		for (const [subjectId, subject] of Object.entries(subjects)) {
			try {
				mustacheCompiler.vmCompile(subject || '', NotificationEditForm.getFakeData(this.getClientRegistry().getLocale()));
			} catch (e) {
				this.addError(`subjects[${subjectId}]`, 'notValidSubject', this.__('Subject has incorrect syntax.'));
			}
		}

		return true;
	}
}