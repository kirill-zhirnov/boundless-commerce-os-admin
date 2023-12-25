import Backgrid from 'backgrid';
import _ from 'underscore';

export default class FilterRow extends Backgrid.FilterRow {
	constructor(options) {
		super(options);

		this.className  = 'filter-row';
	}

	makeCell(column, options) {
		let cellType = null;
		if (_.isFunction(column.get('cell').getType)) {
			cellType = column.get('cell').getType();
		}

		switch (cellType) {
			case 'bulkCheckbox':
				return this.makeBulkCheckboxCell(column, options);
			default:
				return super.makeCell(...arguments);
		}
	}

	makeBulkCheckboxCell(column, options) {
		return new Backgrid.BulkSelectAllCell({
			column
		});
	}
}

Backgrid.FilterRow = FilterRow;