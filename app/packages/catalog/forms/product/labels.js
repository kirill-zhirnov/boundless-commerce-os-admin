import Form from '../../../../modules/form/index';
import _ from 'underscore';

export default class ProductLabels extends Form {
	getRules() {
		return [
			['label', 'inOptions', {options: 'label', multiple: true}]
		];
	}

	async setupAttrs() {
		if (!this.record)
			throw new Error('Record should be set by parent form in form group!');

		//@ts-ignore
		const labels = await this.getModel('label').findLabelsByProducts([this.record.product_id], this.getEditingLang().lang_id);

		this.setAttributes({
			//@ts-ignore
			label: _.pluck(labels[this.record.product_id], 'label_id')
		});
	}

	async save() {
		await this.getModel('productLabelRel')
			//@ts-ignore
			.setRel(this.record.product_id, this.getSafeAttr('label'))
			;
	}

	rawOptions() {
		return {
			//@ts-ignore
			label: this.getModel('label').findOptions(this.getEditingLang().lang_id)
		};
	}
}