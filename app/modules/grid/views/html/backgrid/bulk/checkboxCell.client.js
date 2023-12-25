// @ts-nocheck
import Backgrid from 'backgrid';
import $ from 'jquery';

export default class BulkCheckboxCell extends Backgrid.Cell {
	constructor(options) {
		super(options);

		this.listenTo(this.column, 'backgrid:bulkCheckboxTrigger', this.onCheckboxTriggered);
	}

	className() {
		return 'bulk-checkbox-cell';
	}

	events() {
		return {
			'click' : 'onCellClick',
			'change input' : 'onStateChange'
		};
	}

	render() {
		this.$el.empty();
		this.$el.append($('<input>', {
			tabIndex: -1,
			type: 'checkbox',
			checked: false,
			class: 'form-check-input'
		}));

		this.delegateEvents();

		return this;
	}

	static getType() {
		return 'bulkCheckbox';
	}

	onCheckboxTriggered(column, isChecked) {
		this.$el.find('input').prop('checked', isChecked);
		return this.column.trigger('backgrid:bulkCheckboxChanged');
	}

	onCellClick(e) {
		const $target = $(e.target);

		if ($target.prop('tagName').toLowerCase() !== 'input') {
			return this.$el.find('input').trigger('click');
		}
	}

	onStateChange(e) {
		return this.column.trigger('backgrid:bulkCheckboxChanged');
	}

	isChecked() {
		return this.$el.find('input').is(':checked');
	}
}

Backgrid.BulkCheckboxCell = BulkCheckboxCell;