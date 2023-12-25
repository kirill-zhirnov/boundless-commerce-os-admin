import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';
import $ from 'jquery';

export default class CollectionProductForm extends FormWidget {
	events() {
		return _.extend(super.events(), {
			'click .btn-group button': 'setAction'
		});
	}

	setAction(e) {
		const val = e.currentTarget.value;
		return $('input[name="action"]').attr('value', val);
	}

	getFileName() {
		return __filename;
	}
}