import CustomerGrid from '../customerGrid.client';

export default class CustomerExport extends CustomerGrid {
	initGrid() {
		this.idAttribute = 'person_id';
		return this.columns = [
			{
				label: 'ID',
				name: 'person_id'
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
				label: this.__('Subscribed on marketing emails'),
				name: 'receive_marketing_info',
				cell: 'html',
				html: (column, model) => {
					return model.get('receive_marketing_info') ? 'Yes' : 'No';
				}
			},

			{
				label: this.__('Comment'),
				name: 'comment'
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

			{
				label: this.p__('user', 'Total spent'),
				name: 'total_orders_sum'
			},

			{
				label: this.__('Total orders'),
				name: 'total_orders_qty'
			},
			{
				label: this.__('Registered'),
				name: 'registered_at'
			},
		];
	}
}