import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';
import $ from 'jquery';

const indexRegExp = /\[(\d+)\]$/;

export default class CharacteristicForm extends FormWidget {
	attributes() {
		return {
			name: 'characteristic',
			class: 'characteristic-form',
			action: this.data.action
		};
	}

	run() {
		return this.render('characteristicForm');
	}

	events() {
		return _.extend(super.events(), {
			'change input[name="type"]': 'validateCasesVisibility',
			'keydown .cases-group input'(e) {
				const $input = $(e.target);

				if (e.keyCode === 13) {
					e.preventDefault();

					const $next = $input.parents('.form-group').next('.form-group');
					if ($next.length > 0) {
						return $next.find('.case').get(0).focus();
					}
				}
			},

			'keyup .cases-group input'(e) {
				const $input = $(e.target);

				return this.checkNextCaseExists($input);
			},

			'click .cases-group .rm'(e) {
				e.preventDefault();

				if (this.$('.cases-group .form-group').length > 1) {
					return $(e.target).closest('.form-group').remove();
				}
			}
		});
	}

	runLazyInit() {
		this.validateCasesVisibility();
		this.setupSortable();
	}

	validateCasesVisibility() {
		const casesRow = this.$('.cases-group');
		let type = this.$('input[name="type"]:checked').val();

		if (_.isUndefined(type)) {
			type = this.$('input[name="type"][type="hidden"]').val();
		}

		switch (type) {
			case 'checkbox': case 'radio': case 'select':
				return casesRow.show();
			default:
				return casesRow.hide();
		}
	}

	checkNextCaseExists($input) {
		let emptyInputQty = 0;

		const $fieldset = $input.closest('fieldset');
		$fieldset.find('input.case').each(function () {
			const $el = $(this);

			if ($.trim($el.val()) === '') {
				return emptyInputQty++;
			}
		});

		if (emptyInputQty === 0) {
			const index = this.getNextCaseIndex($fieldset);

			const $newGroup = $fieldset.find('.form-group:eq(0)').clone(false);
			$newGroup.find('.case').val('').attr('name', `case[${index}]`);
			$newGroup.find('.is-new').val('1').attr('name', `isCaseNew[${index}]`);
			$newGroup.find('.sort').val(index);

			return $fieldset.append($newGroup);
		}
	}

	getNextCaseIndex($fieldset) {
		let res;
		const lastName = $fieldset.find('.case')
			.last()
			.attr('name');

		if (!(res = indexRegExp.exec(lastName))) {
			throw new Error(`Cannot find index for name '${lastName}'`);
		}

		const index = parseInt(res[1]) + 1;

		return index;
	}

	setupSortable() {
		this.$('.cases-group fieldset').sortable({
			handle: '.move'
		});
	}

	getFileName() {
		return __filename;
	}
}