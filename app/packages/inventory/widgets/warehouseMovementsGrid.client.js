import GridWidget from '../../system/widgets/grid.client';
import bs from '../../../modules/gHtml/bs.client';

export default class WarehouseMovementsGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('inventory/admin/warehouseMovements/collection');
		this.idAttribute = 'transfer_id';
		this.formMode = 'page';

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Create movement')
				}
			]
		};

		this.columns = [
			{
				name: 'id',
				label: this.__('ID'),
				cell: 'html',
				//				filter : false
				html: (column, model, $td) => {
					if (!model) {
						return '';
					}

					$td.addClass(`status-${model.get('status')} text-center`);
					const status = (() => {
						switch (model.get('status')) {
							case 'draft': return this.p__('transfer', 'Draft');
							case 'completed': return this.p__('transfer', 'Completed');
							case 'cancelled': return this.p__('transfer', 'Cancelled');
						}
					})();

					return `
						<p>ID: ${model.get('transfer_id')}</p>
						<div class="small">
							<p>${status}</p>
							<div>${bs.icon('time')} ${model.get('created_time')}</div>
							<div>${model.get('created_date')}</div>
						</div>
					`;
				}
			},
			{
				label: this.__('From warehouse'),
				name: 'l_from',
				filter: {
					type: 'select',
					options: this.data.options.location
				}
			},
			{
				label: this.__('To warehouse'),
				name: 'l_to',
				filter: {
					type: 'select',
					options: this.data.options.location
				}
			},
			{
				label: this.__('Products qty'),
				customClass: 'text-center',
				name: 'qty',
				filter: () => {
					const attrs =
						{placeholder: this.__('8 or <8 or >8')};
					//						class : 'form-control-sm'

					return `
						${bs.textField(this.data.attrs, 'qty', attrs)}
					`;
				}
			},
			{
				label: this.__('Sum'),
				cell: 'html',
				name: 'sum',
				customClass: 'text-center',
				html: (column, model) => {
					if (!model) {
						return '';
					}

					return `
						${this.getLocale().formatMoney(model.get('sum'))}\
					`;
				},

				filter: () => {
					const attrs =
						{placeholder: this.__('8 or <8 or >8')};
					//						class : 'form-control-sm'

					return `
						${bs.textField(this.data.attrs, 'sum', attrs)}\
					`;
				}
			},
			{
				label: this.__('User'),
				cell: 'html',
				filter: false,
				sortable: false,
				name: 'user',
				customClass: 'small',
				html: (column, model) => {
					if (!model) {
						return '';
					}

					let out = '';
					if (model.get('completed_full_name')) {
						out += `
							<p class="text-success">
								<b>${this.p__('transfer', 'Completed:')}</b> <br/>
								${bs.icon('user')} ${model.get('completed_full_name')}<br/>
								${model.get('completed_ts')}
							</p>
						`;
					}

					if (model.get('cancelled_full_name')) {
						out += `
							<p class="text-warning">
								<b>${this.p__('transfer', 'Cancelled:')}</b> <br/>
								${bs.icon('user')} ${model.get('cancelled_full_name')}<br/>
								${model.get('cancelled_ts')}
							</p>
						`;
					}

					return out;
				}
			},
			{
				label: this.__('Comment'),
				filter: false,
				sortable: false,
				name: 'movement_comment',
				customClass: 'small',
				html: (column, model) => {
					if (!model) {
						return '';
					}

					if (model.get('movement_comment')) {
						return model.get('movement_comment').substr(0, 300);
					}

					return '';
				}
			}
		];

		this.pageSize = {
			options: {
				100: 100,
				500: 500,
				all: this.__('Show all')
			},
			label: this.__('Show per page:')
		};

		this.commonFilter.showRmStatus = false;
	}

	prepareBackgridOptions(options) {
		options.emptyText = this.__('No items');

		return options;
	}

	getFileName() {
		return __filename;
	}

	//@ts-ignore
	className() {
		return 'grid-widget warehouse-movements-grid';
	}
}