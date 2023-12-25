import TreeWidget from '../../../modules/widget/treeWidget.client';
import * as bulkButtonsKit from '../../../modules/bulkButtons/kit.client';
import ajax from '../../../modules/ajax/kit.client';
import _ from 'underscore';

export default class AdminFilterFields extends TreeWidget {
	constructor(options) {
		super(options);

		this.collectionUrl = this.url('catalog/admin/filter/fieldsCollection', {filterId: this.data.filter});
	}

	run() {
		return this.render('adminFilterFields');
	}

	createBulkButtons() {
		return this.bulkButtons = bulkButtonsKit.create({
			buttons: [
				{type: 'rm'}
			]
		});
	}

	prepareBackTreeOptions(options) {
		return _.extend(options, {
			settings: {
				checkbox: true,
				plugins: {
					DnD: {
						changeParent: false
					}
				}
			}
		});
	}

	proceedBulkRemove(pk) {
		return ajax.get(this.url('catalog/admin/filter/rmField'), {id: pk});
	}

	proceedDndStructureChanged(data) {
		return ajax.post(this.url('catalog/admin/filter/saveFieldSort', {filterId: this.data.filter}), data);
	}

	getFileName() {
		return __filename;
	}
}