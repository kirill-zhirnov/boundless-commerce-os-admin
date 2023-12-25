import Form from '../../../modules/form/index';
import _ from 'underscore';
import validator from '../../../modules/validator/validator';
import contrast from 'wcag-contrast';

export default class Label extends Form {
	constructor(options) {
		super(options);

		this.labelIcons = ['noicon', 'star', 'flag', 'fire', 'ok', 'tag', 'heart'];
	}

	getRules() {
		return [
			['title', 'required'],
			['color', 'required'],
			['color', 'validateHexColor'],
			['icon', 'validateIcon'],
			['removeAfter', 'validateRemoveAfter'],
			['days', 'validateDays']
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('label').findException({
			include: [{
				model: this.getModel('labelText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				label_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		//@ts-ignore
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['label_id', 'color', 'icon', 'remove_after']));

		//@ts-ignore
		_.extend(attrs, _.pick(row.labelTexts[0], [
			'title'
		])
		);

		return this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord() || this.getModel('label').build();

		//@ts-ignore
		const {days, color, title} = attrs;

		//@ts-ignore
		if (attrs.icon === 'noicon') {
			//@ts-ignore
			attrs.icon = null;
		}

		//@ts-ignore
		row.set(_.pick(attrs, ['icon', 'color']));
		//@ts-ignore
		row.set('remove_after', days);
		//@ts-ignore
		row.set('text_color', this.chooseTextColor(color));

		//@ts-ignore
		await row.save();
		//@ts-ignore
		this.pk = row.label_id;

		await this.getModel('labelText').update({
			title
		}, {
			where: {
				//@ts-ignore
				label_id: row.label_id,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	chooseTextColor(bgColor, txtColor1 = '#000000', txtColor2 = '#ffffff') {
		const score1 = contrast.hex(`${bgColor}`, `${txtColor1}`);
		const score2 = contrast.hex(`${bgColor}`, `${txtColor2}`);

		if (score1 > score2) {
			return txtColor1;
		} else {
			return txtColor2;
		}
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.icons = this.labelIcons;

		//@ts-ignore
		if ((data.attrs.icon == null)) {
			//@ts-ignore
			data.attrs.icon = 'noicon';
		}

		return data;
	}

	validateRemoveAfter(value, options, field, attributes) {
		if ((value == null) && (attributes.days !== '')) {
			this.addError(field, 'remAfter', this.getI18n().__('Can\'t set days without checkbox being selected.'));
		}

		return true;
	}

	validateDays(value, options, field, attributes) {
		if (attributes.removeAfter != null) {
			if (!validator.isNumeric(value)) {
				this.addError(field, 'remAfter', this.getI18n().__('String should contain only numbers.'));
				return;
			}

			value = Number(value);
			if (isNaN(value) || (value < 1)) {
				this.addError(field, 'remAfter', this.getI18n().__('Number of days should be bigger than 0.'));
				return;
			}
		}

		return true;
	}

	validateIcon(value, options, field) {
		if (!_.contains(this.labelIcons, value)) {
			this.addError(field, 'remAfter', this.getI18n().__('Invalid icon.'));
		}

		return true;
	}

	validateHexColor(value, options, field) {
		const reg = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		if ((value != null) && (value.search(reg) === -1)) {
			this.addError(field, 'color', this.getI18n().__('Invalid hex color format.'));
		}

		return true;
	}
}