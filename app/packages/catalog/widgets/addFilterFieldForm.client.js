import FormWidget from '../../../modules/widget/form.client';
import Backbone from '../../../modules/backbone/index.client';
import ajax from '../../../modules/ajax/kit.client';
import bs from '../../../modules/gHtml/bs.client';

export default class AddFilterFieldForm extends FormWidget {
	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('catalog/admin/filter/addField', {filter: this.data.filter}),
			class: 'add-filter-field-form'
		});
	}

	run() {
		return this.render('addFilterFieldForm');
	}

	events() {
		return Object.assign(super.events(), {
			'change select[name="type"]': 'onTypeChange'
		});
	}

	async onTypeChange(e) {
		const $select = Backbone.$(e.currentTarget);
		const $wrapper = this.$('.characteristic-wrapper');
		const val = $select.val();

		if (/^\d+$/.test(val)) {
			const data = await ajax.get(this.url('catalog/admin/filter/loadCharacteristic', {
				filterId: this.data.filter,
				groupId: val
			}));

			$wrapper.html(this.renderCharacteristic(data.characteristics, data.checked));
		} else {
			$wrapper.empty();
		}
	}

	renderCharacteristic(characteristic, checked) {
		const filtered = characteristic.filter(el => Array.isArray(el) || el.list?.length > 0);
		if (!filtered?.length) {
			return `
				<div class='tinted-box text-muted'>
					<i class="fa fa-info-circle" aria-hidden="true"></i>
					${this.__('Selected Product Type doesn\'t have any Attributes.')}
				</div>
			`;
		}

		let out = '';
		for (const row of Array.from(characteristic)) {
			if (Array.isArray(row)) {
				out += this.renderCharacteristicCheckboxList(row, checked);
			} else {
				out += `
					<fieldset>
						<legend>${row.title}</legend>
						${this.renderCharacteristicCheckboxList(row.list, checked)}
					</fieldset>
				`;
			}
		}

		return out;
	}

	renderCharacteristicCheckboxList(options, checked) {
		return bs.checkboxList({checked}, 'checked', options, {
			inputOptions: {
				name: 'characteristic[]'
			}
		});
	}

	getFileName() {
		return __filename;
	}
}