import GridWidget from '../../system/widgets/grid.client';
import _ from 'underscore';

export default class TaxClassesGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('system/admin/tax/taxClassCollection');
		this.idAttribute = 'tax_class_id';
		this.cssGridWrapper = 'col-md-8 offset-md-2';
		this.commonFilter = {showRmStatus: false};
		this.formMode = 'page';

		Object.assign(this.staticUrls, {
			form: this.url('system/admin/tax/editTaxClass'),
		});

		this.columns = [
			{
				label: this.__('Title'),
				name: 'title',
				filter: false,
			},
			{
				label: this.__('Is default?'),
				sortable: false,
				filter: false,
				// clickable: false,
				cell: 'html',
				name: 'is_default',
				customClass: 'text-center',
				html: (column, model) => {
					if (!model) return;

					return model.get('is_default') ? this.__('Yes') : this.__('No');
				}
			},
			{
				cell: 'buttons',
				buttons: [
					{
						type: 'rm',
						label: this.__('Delete')
					}
				]
			}
		];

		this.commonButtons = null;
	}

	getFileName() {
		return __filename;
	}
}