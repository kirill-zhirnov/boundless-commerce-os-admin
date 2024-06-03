import Form from '../../../../modules/form/index';
import {IEmailTplModel} from '../../models/emailTpl';
import {compile} from '../../modules/mustacheCompiler';

interface IAttrs {
	subject: string;
	template: string;
}

export default class EmailTplForm extends Form<IAttrs, IEmailTplModel> {
	getRules() {
		return [
			['template', 'required'],
			['subject', 'trim'],
			['alias', 'safe'],
			['subject, template', 'validateTemplate']
		];
	}

	async loadRecord() {
		const row = (await this.getModel('emailTpl').findOne({
			where: {
				id: this.pk
			}
		})) as IEmailTplModel;

		return row;
	}

	async save() {
		const {template, subject} = this.getSafeAttrs();

		await this.record.update({
			template,
			subject: subject == '' ? null : subject
		});
	}

	async getTplData() {
		const out = await super.getTplData();

		Object.assign(out, {
			row: this.record.toJSON()
		});

		return out;
	}

	async validateTemplate(value, options, field) {
		try {
			compile(value, {});
		} catch (e) {
			this.addError(field, 'mustacheError', 'Cant compile template');
		}
	}
}