import Form from '../../../../modules/form/index';

export default class SizeForm extends Form {
	getRules() {
		return [
			[
				'length, width, height, weight',
				'isDotNumeric',
				{min: 0}
			]
		];
	}

	setupAttrsByRecord() {
		//@ts-ignore
		this.setAttrsByField(this.record.productProp.size);
	}

	setAttrsByField(field) {
		let attrs = Object.assign({
			length: '',
			width: '',
			height: '',
			weight: ''
		}, field);

		Object.keys(attrs).forEach((key) => {
			attrs[key] = this.prepareNumber(attrs[key]);
		});

		this.setAttributes(attrs);
	}

	save() {
		//@ts-ignore
		let productProp = this.record.productProp;
		productProp.size = this.getSizeForSave();

		return productProp.save();
	}

	getSizeForSave() {
		let attrs = this.getSafeAttrs(),
			out = {}
		;

		['length', 'width', 'height', 'weight'].forEach((key) => {
			let val = attrs[key];

			if (val === '') {
				attrs[key] = null;
				return;
			}

			out[key] = this.prepareNumber(val);
		});

		return out;
	}

	prepareNumber(val) {
		if (val === null || val === '')
			return val;

		val = String(val).replace(',', '.');
		val = Number(val);

		if (isNaN(val))
			val = null;

		return val;
	}
}