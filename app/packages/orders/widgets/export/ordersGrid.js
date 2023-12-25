import OrdersGrid from '../ordersGrid.client';

export default class OrdersExport extends OrdersGrid {
	initGrid() {
		const locale = this.getClientRegistry().getLocale();

		this.export = ['excel'];
		this.idAttribute = 'order_id';
		this.columns = [
			{
				name: 'order_id',
				label: 'ID'
			},

			{
				label: this.__('Status'),
				name: 'status_title'
			},

			{
				label: this.__('Date'),
				name: 'created_at'
			},

			{
				label: this.__('Items subtotal (%s)', [locale.getCurrencySymbol()]),
				name: 'items_subtotal'
			},

			{
				label: this.__('Items subtotal (qty)'),
				name: 'total_qty'
			},

			{
				label: this.__('Discount (%s)', [locale.getCurrencySymbol()]),
				name: 'order_discount'
			},

			{
				label: this.__('Shipping'),
				cell: 'html',
				html(column, model) {
					return model.get('delivery_title') || model.get('custom_delivery_title') || '';
				}

			},

			{
				label: this.__('Shipping (%s)', [locale.getCurrencySymbol()]),
				name: 'order_shipping_price'
			},

			{
				label: this.__('Total (%s)', [locale.getCurrencySymbol()]),
				name: 'total_price'
			},

			{
				label: this.__('Is paid?'),
				cell: 'html',
				html(column, model) {
					if (model.get('is_paid')) {
						return this.__('Yes');
					} else {
						return this.__('No');
					}
				}
			},

			{
				label: this.__('First name'),
				name: 'first_name'
			},

			{
				label: this.__('Last name'),
				name: 'last_name'
			},

			{
				label: this.__('Email'),
				name: 'email'
			},

			{
				label: this.__('Phone'),
				name: 'phone'
			},

			{
				label: this.__('Country (shipping)'),
				name: 'shipping_country_title'
			},
			{
				label: this.__('State (shipping)'),
				name: 'shipping_state'
			},
			{
				label: this.__('City (shipping)'),
				name: 'shipping_city'
			},

			{
				label: this.__('ZIP (shipping)'),
				name: 'shipping_zip'
			},

			{
				label: this.__('Address 1 (shipping)'),
				name: 'shipping_address_line_1'
			},
			{
				label: this.__('Address 2 (shipping)'),
				name: 'shipping_address_line_2'
			},
			{
				label: this.__('Company (shipping)'),
				name: 'shipping_company'
			},

			{
				label: this.__('Country (billing)'),
				name: 'billing_country_title'
			},
			{
				label: this.__('State (billing)'),
				name: 'billing_state'
			},
			{
				label: this.__('City (billing)'),
				name: 'billing_city'
			},

			{
				label: this.__('ZIP (billing)'),
				name: 'billing_zip'
			},

			{
				label: this.__('Address 1 (billing)'),
				name: 'billing_address_line_1'
			},
			{
				label: this.__('Address 2 (billing)'),
				name: 'billing_address_line_2'
			},
			{
				label: this.__('Company (billing)'),
				name: 'billing_company'
			},
		];

		// const customAttrs = this.data?.options?.customAttrs || [];
		// if (customAttrs.length) {
		// 	for (const attr of customAttrs) {
		// 		this.columns.push({
		// 			label: attr.title,
		// 			cell: 'html',
		// 			html(column, model) {
		// 				if (!model.get('custom_attrs') || !model.get('custom_attrs')[attr.key]) return '';
		//
		// 				const value = model.get('custom_attrs')[attr.key];
		// 				if (attr.type === 'checkbox') {
		// 					if (!Array.isArray(value)) return value;
		//
		// 					return attr.options.filter(el => value.includes(el.id)).map(el => el.title).join(', ');
		// 				}
		// 				if (attr.type === 'dropdown') {
		// 					return attr.options.find(el => value === el.id)?.title || '';
		// 				}
		//
		// 				if (typeof value !== 'string') {
		// 					return JSON.stringify(value);
		// 				}
		//
		// 				return value;
		// 			}
		// 		});
		// 	}
		// }
	}
}