import GridWidget from '../../system/widgets/grid.client';
import modalKit from '../../../modules/modal/kit.client';
import gHtml from '../../../modules/gHtml/index.client';
import {getImgCloudUrl} from '../../../modules/s3Storage/cloudUrl';

export default class DeliveryGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'delivery-grid col-md-10 offset-md-1';
		this.collection = this.url('orders/admin/setup/delivery/settingsCollection');

		this.idAttribute = 'delivery_id';

		this.columns = [
			{
				label: this.__('Title'),
				name: 'title',
				cell: 'html',
				sortable: false,
				html: (column, model) => {
					const alias = model.get('shipping_alias') ? model.get('shipping_alias') : 'custom';
					let price = '';
					if ((model.get('calc_method') === 'single') && model.get('single_price')) {
						price = gHtml.tag('span', {class: 'text-muted'}, ', ' + this.getLocale().formatMoney(model.get('single_price')));
					}

					let logoAttrs = {class: 'logo'};
					const img = model.get('img');
					if ((alias === 'custom') && img) {
						logoAttrs = {
							class: 'logo img',
							style: `background-image: url(${getImgCloudUrl(img, 80)})`
						};
					}

					let out = `<p class="shipping-${alias}">
${gHtml.tag('span', logoAttrs, '')}
${model.get('title')}${price}
</p>`;

					if (model.get('shipping_alias') && (model.get('shipping_alias') !== 'selfPickup')) {
						out += `<div class="small"><b>${this.__('Shipping company:')}</b> ${model.get('shipping_title')}</div>`;
					}

					if (model.get('description')) {
						out += gHtml.tag('div', {class: 'small'}, model.get('description'));
					}

					return out;
				}

			},
			{
				label: this.__('Sort'),
				name: 'sort',
				filter: false,
				customClass: 'text-center col-80'
			},
			{
				cell: 'buttons',
				customClass: 'text-center col-80',
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
					label: this.__('Create shipping method')
				},
				{
					label: this.__('Shipping discounts'),
					icon: 'fa fa-tags',
					class: 'ms-2',
					attrs: {
						'href': this.url('orders/admin/setup/discount/index')
					}
				}
			]
		};
	}

	onCommonActionAdd() {
		return modalKit.createRemote(this.url('orders/admin/setup/delivery/createForm'));
	}

	onActionEdit(model, $btn) {
		let url;
		switch (model.get('shipping_alias')) {
			case 'selfPickup':
				url = this.url('orders/admin/setup/delivery/formSelfPickup', {pk: model.get('delivery_id')});
				break;
			// case 'boxBerry':
			// 	url = this.url('orders/admin/setup/delivery/formBoxBerry', {pk: model.get('delivery_id')});
			// 	break;
			// case 'rusSnailMail':
			// 	url = this.url('orders/admin/setup/delivery/formRusSnailMail', {pk: model.get('delivery_id')});
			// 	break;
			// case 'cdek':
			// 	url = this.url('orders/admin/setup/delivery/cdek', {pk: model.get('delivery_id')});
			// 	break;
			default:
				url = this.url('orders/admin/setup/delivery/formCustom', {pk: model.get('delivery_id')});
		}

		return modalKit.createRemote(url);
	}

	getFileName() {
		return __filename;
	}
}
