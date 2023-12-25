import Form from '../../../../modules/form/index';
import * as mustacheCompiler from '../../../system/modules/mustacheCompiler';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import Locale from '../../../../modules/locale';
import {TQueueEventType} from '../../../../@types/rabbitMq';
const readFile = promisify(fs.readFile);

interface IAttrs {
	status_id: string | number;
	template: string;
	subject: string;
	event_type: string;
}

export default class NotificationEditForm extends Form<IAttrs> {
	protected transport: string = 'email';

	getRules() {
		return [
			['template, subject, event_type', 'required'],
			['event_type', 'inOptions', {options: 'eventType'}],
			['status_id', 'inOptions', {options: 'status'}],
			['event_type', 'validateUniqueEventType'],
			['status_id', 'validateUniqueStatus'],
			['template', 'validateTemplate'],
			['subject', 'validateTemplate'],
			['template, subject', 'trim']
		];
	}

	async save() {
		const {status_id, subject, template, event_type} = this.getSafeAttrs();

		await this.getDb().sql(`
			insert into	notification_template
				(status_id, transport, template, subject, event_type)
			values
				(:status_id, :transport, :template, :subject, :event_type)
		`, {
			status_id: event_type === TQueueEventType.updated ? Number(status_id) : null,
			template,
			transport: this.transport,
			subject,
			event_type
		});
	}

	async rawOptions() {
		return {
			status: await this.loadOrderStatusOptions(),
			template: await this.getDefaultTemplates(),
			eventType: [
				[TQueueEventType.created, this.__('Order created')],
				[TQueueEventType.updated, this.__('Order updated')],
			]
		};
	}

	async loadOrderStatusOptions() {
		const out = [['', this.__('Select status')]];

		const rows = await this.getDb().sql<{status_id: number, title: string}>(`
			select
				status_id,
				title
			from
				order_status
			inner join order_status_text using(status_id)
			where
				lang_id = :lang
			order by sort
		`, {
			lang: this.getEditingLang().lang_id
		});

		return out.concat(rows.map(el => ([String(el.status_id), el.title])));
	}

	async getDefaultTemplates() {
		const files = [
			'new', 'in_progress', 'ready_to_ship', 'sent', 'completed', 'cancelled', 'default'
		];

		const rows = await this.getDb().sql<{status_id: number, alias: string}>(`
			select
				status_id,
				alias
			from
				order_status
			where
				alias is not null
		`, {
			lang: this.getEditingLang().lang_id
		});

		const newTplContent = await readFile( path.join(__dirname, './form/new.html'), {encoding: 'utf-8'});
		const [newSubject, newTemplate] = newTplContent.split(/\n==+\n([\s\S]+)?/);

		const templates = {
			updated: {},
			created: {subject: newSubject, template: newTemplate}
		};

		for (const row of rows) {
			const alias = files.includes(row.alias) ? row.alias : 'default';
			const templatePath = path.join(__dirname, `./form/${alias}.html`);
			const content = await readFile(templatePath, {encoding: 'utf-8'});
			if (!content) return;

			const [subject, template] = content.split(/\n==+\n([\s\S]+)?/);
			templates.updated[row.status_id] = {subject, template};
		}

		return templates;
	}

	async validateUniqueEventType(value) {
		if (this.attributes.event_type !== TQueueEventType.created) {
			return;
		}

		const [row] = await this.getDb().sql<{total: number}>(`
			select
				count(*) as total
			from
				notification_template
			where
				event_type = :eventType
				and transport = :transport
		`, {
			eventType: value,
			transport: this.transport
		});

		if (row.total > 0) {
			this.addError('event_type', 'exists', this.__('Notification for the type already exists.'));
			return;
		}
	}

	async validateUniqueStatus(value, options, field) {
		if (this.attributes.event_type !== TQueueEventType.updated) {
			return;
		}

		if (value == '') {
			this.addError(field, 'required', this.__('Status is required'));
			return;
		}

		const [row] = await this.getDb().sql(`
			select
				status_id
			from
				notification_template
			where
				status_id = :statusId
				and transport = :transport
		`, {
			statusId: Number(value),
			transport: this.transport
		});

		if (row) {
			this.addError(field, 'notificationExist', this.__('Notification for the status already exists.'));
			return;
		}
	}

	validateTemplate(value, options, field) {
		try {
			mustacheCompiler.vmCompile(value, NotificationEditForm.getFakeData(this.getClientRegistry().getLocale()));
		} catch (e) {
			this.addError(field, 'notValidTemplate', this.__('Template has incorrect syntax.'));
			return false;
		}
		return true;
	}

	static getFakeData(locale: Locale) {
		return {
			ORDER_ID: 1,
			ORDER_SUM: locale.formatMoney(1200),
			TRACK_NUM: 'AAABBB'
		};
	}
}