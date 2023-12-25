import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

export default class CouponCodesGrid extends GridWidget {
	initGrid() {
		this.cssGridWrapper = 'col-md-10 offset-md-1';
		this.collection = this.url('orders/admin/discount/codes/collection');

		this.columns = [
			{
				label: this.__('Campaign title'),
				name: 'title',
				cell: 'html',
				html: (column, model) => {
					let out = gHtml.tag('p', {}, model.get('title'));
					out += gHtml.tag(
						'div',
						{class: 'text-muted small'},
						`${this.__('Created at:')} ${format(parseISO(model.get('created_at')), 'd MMM yyyy, HH:mm')}`
					);

					return out;
				}
			},
			{
				label: this.__('Discount'),
				name: 'discount',
				cell: 'html',
				customClass: 'text-center col-100',
				filter: {
					type: 'select',
					options: this.data.options.type
				},
				sortable: false,
				html: (column, model) => {
					switch (model.get('discount_type')) {
						case 'fixed':
							return this.getLocale().formatMoney(model.get('discount_value'));

						case 'percent':
							return `${model.get('discount_value')}%`;
					}
				}
			},
			{
				label: this.p__('discount', 'Codes'),
				name: 'code',
				cell: 'html',
				sortable: false,
				html: (column, model) => {
					let out = model.get('codes').join('<br>');

					if (model.get('total_codes') > 5)
						out += `<br>...<p class="small">${this.__('Total promo codes: %s', [model.get('total_codes')])}</p>`;

					return out;
				}
			},
			{
				label: this.__('Statistics'),
				cell: 'html',
				filter: false,
				sortable: false,
				customClass: 'small',
				html: (column, model) => {
					if (!model) return;

					let out = gHtml.tag('p', {}, `${this.__('Orders total:')} ${model.get('total_orders')}`);
					out += gHtml.tag('p', {}, `${this.p__('user', 'Orders sum')}: ${this.formatMoney(model.get('sum_price'))}`);
					out += gHtml.tag('div', {}, `${this.__('Discount sum')}: ${this.formatMoney(model.get('sum_discount'))}`);

					return out;
				}
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
				scope: (model) => {
					return model.get('deleted_at') ? 'removed' : 'normal';
				}
			}
		];
	}

	getFileName() {
		return __filename;
	}
}