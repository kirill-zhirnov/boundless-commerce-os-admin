// @ts-nocheck
import Backgrid from 'backgrid';
import gHtml from '../../../../../gHtml/index.client';

// Cell is used in filter row to have button select all/none for bulk checkboxes
export default class BulkSelectAllCell extends Backgrid.HeaderHtmlCell {
	constructor(options) {
		super(options);

		this.tagName = 'th';
		this.listenTo(this.column, 'backgrid:collectionReset', function(name) {
			return this.render();
		});
	}

	events() {
		return {
			'input input'(e) {
				return this.column.trigger('backgrid:bulkCheckboxTrigger', this.column, $(e.currentTarget).is(':checked'));
			}
		};
	}

	className() {
		return 'bulk-checkbox-cell';
	}

	render() {
		this.$el.html(gHtml.checkbox('all', 0, {class: 'skip'}));

		this.delegateEvents();

		return this;
	}
}
Backgrid.BulkSelectAllCell = BulkSelectAllCell;