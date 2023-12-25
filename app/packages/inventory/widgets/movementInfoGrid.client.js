import ChangeQtyGrid from './changeQtyGrid.client';
import _ from 'underscore';
import modalKit from '../../../modules/modal/kit.client';

export default class MovementInfoGrid extends ChangeQtyGrid {
	initGrid() {
		super.initGrid();

		this.export = [];
		this.collection = this.url('inventory/admin/history/changeQty/movementInfoCollection', {movement_item_id: this.data.movementItemId});
		this.wrapperTpl = {
			type: 'widget',
			file: 'gridHtmlWrapper',
			package: 'system'
		};

		const newColumns = [];
		for (let i = 0; i < this.columns.length; i++) {
			const column = this.columns[i];
			if (_.indexOf(['item', 'location'], column.name) !== -1) {
				column.filter = false;
				column.clickable = false;
				column.sortable = false;
				newColumns.push(column);
			}
		}

		this.columns = newColumns;
		return this.showPagination = false;
	}

	setupDatepicker() {
	}

	events() {
		return _.extend(super.events(), {
			'click .column-item a': 'onContentLinkClicked'
		});
	}

	onContentLinkClicked() {
		const modal = modalKit.getActive();

		if (modal) {
			return modal.close();
		}
	}

	getFileName() {
		return __filename;
	}
}