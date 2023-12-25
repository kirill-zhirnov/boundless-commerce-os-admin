const FilterFormFields = require('./formFields');

class ManufacturerFilterFormFields extends FilterFormFields {
	getRules() {
		return [
			['manufacturerId, filterId', 'required'],
			['manufacturerId, filterId', 'isNum', {min: 1, no_symbols: true}],
			['values', 'safe']
		];
	}

	getFiltersSelect() {
		let select = this.getBasicFiltersSelect();

		select.where('filter_field.type != ?', 'brand');

		return select;
	}

	getProductCalcSelect() {
		let select = this.getBasicProductCalc();

		select
			.where('product.manufacturer_id = ?', this.getSafeAttr('manufacturerId'))
		;

		return select;
	}
}

module.exports = ManufacturerFilterFormFields;