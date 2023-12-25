import GridWidget from '../../system/widgets/grid.client';
import modalKit from '../../../modules/modal/kit.client';

export default class PaymentMethodGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'payment-method-grid col-sm-8 offset-sm-2';
		this.collection = this.url('payment/admin/paymentMethod/collection');
		this.idAttribute = 'payment_method_id';
		this.columns = [
			{
				label: this.__('Title'),
				name: 'title',
				filter: false,
				sortable: false,
				cell: 'html',
				customClass: 'col-title',
				html: (column, model, $td) => {
					$td.addClass(`payment-alias-${model.get('alias')}`);

					let description = '';
					if (model.get('description')) {
						description = `<p class="small mb-0">${model.get('description')}</p>`;
					}

					return `<p class="alias-${model.get('alias')}"><span class="payment-gateway-logo"></span> ${model.get('title')}</p> ${description}`;
				}
			},
			{
				label: this.__('Sort'),
				filter: false,
				name: 'sort',
				customClass: 'text-center col-80'
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'rm'}
					],

					removed: [
						{type: 'restore'}
					]
				},

				scope(model) {
					if (model.get('deleted_at') != null) {
						return 'removed';
					} else {
						return 'normal';
					}
				}
			}
		];

		this.bulkButtons = {
			buttons: {
				normal: [
					{type: 'rm'}
				],
				removed: [
					{type: 'restore'}
				]
			},

			scope: () => {
				const models = this.htmlView.getCheckedModels(true);
				if (models[0] && (models[0].get('deleted_at') != null)) {
					return 'removed';
				}

				return 'normal';
			}
		};

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Add a payment method')
				}
			]
		};
	}

	onCommonActionAdd() {
		return modalKit.createRemote(['payment/admin/paymentMethod/addForm']);
	}

	onActionEdit(model, $btn) {
		return modalKit.createRemote(model.get('editUrl'));
	}

	getFileName() {
		return __filename;
	}
}