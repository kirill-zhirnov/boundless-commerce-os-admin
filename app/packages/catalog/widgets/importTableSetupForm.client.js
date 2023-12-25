import FormWidget from '../../../modules/widget/form.client';
import $ from 'jquery';

export default class ImportTableSetupForm extends FormWidget {
	constructor(options) {
		super(options);

		this.alphabet = this.getAlphabet();
	}

	attributes() {
		return Object.assign(super.attributes(), {
			action: this.url('catalog/admin/import/setupTableImport'),
			class: 'import-csv-setup-form'
		});
	}

	run() {
		return this.render('importTableSetupForm', {mappingColumns: this.getMappingColumns()});
	}

	runLazyInit() {
		this.onOnlyUpdateTicked();
		this.onOnlyInsertTicked();

		//@ts-ignore
		this.$('.mapping tfoot select')
			.each((key, val) => this.onMappingChange({currentTarget: val}));
	}

	events() {
		return Object.assign(super.events(), {
			'click button[data-modal-close]': 'onCancelClicked',
			'change input[name="only_update"]': 'onOnlyUpdateTicked',
			'change input[name="only_insert"]': 'onOnlyInsertTicked',
			'change .mapping tfoot select': 'onMappingChange'
		});
	}

	onMappingChange(e) {
		const $el = $(e.currentTarget);

		const cells = this.$(`.mapping .col-${$el.data('column-label')}`);
		if ($el.val() !== '') {
			cells.addClass('success');
		} else {
			cells.removeClass('success');
		}
	}

	onOnlyInsertTicked() {
		const $el = this.$('input[name="only_insert"]');
		const $onlyUpdate = this.$('input[name="only_update"]');

		if ($el.prop('checked')) {
			//@ts-ignore
			return $onlyUpdate.attr('disabled', true).parents('.checkbox:eq(0)').addClass('disabled');
		} else {
			//@ts-ignore
			return $onlyUpdate.attr('disabled', false).parents('.checkbox:eq(0)').removeClass('disabled');
		}
	}

	onOnlyUpdateTicked() {
		const $el = this.$('input[name="only_update"]');
		const $onlyInsert = this.$('input[name="only_insert"]');

		if ($el.prop('checked')) {
			//@ts-ignore
			return $onlyInsert.attr('disabled', true).parents('.checkbox:eq(0)').addClass('disabled');
		} else {
			//@ts-ignore
			return $onlyInsert.attr('disabled', false).parents('.checkbox:eq(0)').removeClass('disabled');
		}
	}

	onCancelClicked(e) {
		e.preventDefault();

		if (confirm(this.__('Are you sure to cancel import?'))) {
			return this.getClientRegistry().getClientNav().url(this.url('catalog/admin/product/index'));
		}
	}

	getMappingColumns() {
		let maxColumns = -1;

		for (let row of Array.from(this.data.firstRows)) {
			if (row.length > maxColumns) {
				maxColumns = row.length;
			}
		}

		if (maxColumns > 0) {
			maxColumns--;
		}

		const out = [];
		for (let i = 0, end = maxColumns, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
			out.push(this.getColumnLabel(i));
		}

		return out;
	}

	getAlphabet() {
		return [
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
			'H',
			'I',
			'J',
			'K',
			'L',
			'M',
			'N',
			'O',
			'P',
			'Q',
			'R',
			'S',
			'T',
			'U',
			'V',
			'W',
			'X',
			'Y',
			'Z'
		];
	}

	getColumnLabel(index) {
		const lastIndex = this.alphabet.length - 1;

		let lap = Math.floor(index / lastIndex);
		const rest = index % lastIndex;

		if ((rest === 0) && (lap > 0)) {
			lap--;
		}

		let wordKey = index - (lap * lastIndex);

		let name = '';
		if (lap > 0) {
			wordKey--;
			name += this.alphabet[(lap - 1)];
		}

		name += this.alphabet[wordKey];

		return name;
	}

	showError($form, $el, elName, elErrors) {
		if (elName === 'mapping') {
			return this.$('.mapping-wrapper').after(`
				<div class="form-error alert alert-danger">${elErrors[0]}</div>
			`);
		} else {
			//@ts-ignore
			return super.showError($form, $el, elName, elErrors);
		}
	}

	getFileName() {
		return __filename;
	}
}