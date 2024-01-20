import DataProvider from '../../../../modules/dataProvider/index';
import {ICountryModelStatic} from '../../../delivery/models/country';
import validator from '../../../../modules/validator/validator';
import {ICustomerGroupModelStatic} from '../../models/customerGroup';

export default class CustomerDataProvider extends DataProvider {
	protected defaults = {
		rmStatus: 0,
		perPage: 50
	};
	protected validPageSize: (number | boolean)[] = [50, 100, 500, false];

	getRules() {
		return [
			['country_id, group_id', 'isNum'],
			['receive_marketing_info', 'inOptions', {options: 'subscribe'}],
			['customer_role', 'inOptions', {options: 'customerRole'}],
			['orders_sum, address, user', 'safe'],
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.field('person.*');

		this.q.field('person_profile.first_name');
		this.q.field('person_profile.last_name');
		this.q.field('person_profile.phone');
		this.q.field('person_profile.receive_marketing_info');
		this.q.field('person_profile.comment');

		//shipping address for export grid
		this.q.field('shipping_country.country_id', 'shipping_country_id');
		this.q.field('shipping_country.title', 'shipping_country_title');
		this.q.field('shipping.state', 'shipping_state');
		this.q.field('shipping.city', 'shipping_city');
		this.q.field('shipping.address_line_1', 'shipping_address_line_1');
		this.q.field('shipping.address_line_2', 'shipping_address_line_2');
		this.q.field('shipping.zip', 'shipping_zip');
		this.q.field('shipping.company', 'shipping_company');

		//billing address for export grid
		this.q.field('billing_country.country_id', 'billing_country_id');
		this.q.field('billing_country.title', 'billing_country_title');
		this.q.field('billing.state', 'billing_state');
		this.q.field('billing.city', 'billing_city');
		this.q.field('billing.address_line_1', 'billing_address_line_1');
		this.q.field('billing.address_line_2', 'billing_address_line_2');
		this.q.field('billing.zip', 'billing_zip');
		this.q.field('billing.company', 'billing_company');

		//default address for main grid
		this.q.field('vw_country.country_id');
		this.q.field('vw_country.title', 'country_title');
		this.q.field('person_address.state');
		this.q.field('person_address.city');
		this.q.field('person_address.address_line_1');
		this.q.field('person_address.address_line_2');

		this.q.field('orders_stat.total_orders_sum');
		this.q.field('orders_stat.total_orders_qty');
		this.q.field('customer_groups.groups');

		// this.q.field('roles.aliases', 'role_aliases');

		this.q.from('person');
		this.q.join('person_profile', null, 'person.person_id = person_profile.person_id');
		this.q.left_join('person_address', null, 'person_address.person_id = person.person_id and person_address.is_default is true');
		this.q.left_join('vw_country', null, 'vw_country.country_id = person_address.country_id');

		this.q.left_join('person_address', 'shipping', 'shipping.person_id = person.person_id and shipping.type = \'shipping\'');
		this.q.left_join('vw_country', 'shipping_country', 'shipping_country.country_id = shipping.country_id');

		this.q.left_join('person_address', 'billing', 'billing.person_id = person.person_id and billing.type = \'billing\'');
		this.q.left_join('vw_country', 'billing_country', 'billing_country.country_id = billing.country_id');

		this.q.left_join(`
			(
				select
					customer_id,
					sum(total_price) as total_orders_sum,
					count(order_id) as total_orders_qty
				from
					orders
					inner join order_status using(status_id)
				where
					order_status.alias != 'cancelled'
				group by
					customer_id
			)
			`,
			'orders_stat',
			'orders_stat.customer_id = person.person_id'
		);
		this.q.left_join(`
			(
				select
					person_id,
					json_agg(customer_group.title order by customer_group.title) as groups
				from
					customer_group
					inner join person_group_rel using (group_id)
				group by
					person_id
			)
		`, 'customer_groups', 'customer_groups.person_id = person.person_id');

		this.q.where('person.site_id = ?', this.getEditingSite().site_id);
		this.compareRmStatus('person.deleted_at');
		this.q.where('person.status = ?', 'published');
		this.q.where(`
			exists (
				select 1
				from
				person_role_rel
				inner join role using (role_id)
				where
					person_role_rel.person_id = person.person_id
					and role.alias in ('client', 'guest-buyer')
			)
		`);

		//@ts-ignore
		const {user, address, orders_sum, country_id, receive_marketing_info, customer_role, group_id} = this.getSafeAttrs();

		if (validator.trim(address)) {
			const addressLike = `%${String(address).toLowerCase()}%`;
			this.q.where(`
				lower(person_address.state) like ?
				or lower(person_address.city) like ?
				or lower(person_address.address_line_1) like ?
				or lower(person_address.address_line_2) like ?
				`, addressLike, addressLike, addressLike, addressLike
			);
		}

		if (group_id) {
			this.q.where(`
				exists (
					select 1 from person_group_rel
					where
						person_group_rel.person_id = person.person_id
						and person_group_rel.group_id = ?
				)
			`, [group_id]);
		}

		if (receive_marketing_info) {
			this.q.where('person_profile.receive_marketing_info = ?', receive_marketing_info == '1' ? true : false);
		}

		if (customer_role) {
			if (customer_role === 'registered') {
				this.q.where('person.registered_at is not null');
			} else if (customer_role === 'guest') {
				this.q.where('person.registered_at is null');
			}
		}

		if (validator.trim(user)) {
			const userLike = `%${String(user).toLowerCase()}%`;
			this.q.where(`
				lower(person_profile.first_name) like ?
				or lower(person_profile.last_name) like ?
				or lower(person_profile.phone) like ?
				or lower(person.email) like ?
				`, userLike, userLike, userLike, userLike
			);
		}
		this.compare('person_address.country_id', country_id);
		this.compare('orders_stat.total_orders_sum', orders_sum);
	}

	sortRules() {
		return {
			default: [{user: 'asc'}],
			attrs: {
				user: {
					asc: 'person_profile.first_name asc, person_profile.last_name asc nulls last',
					desc: 'person_profile.first_name desc, person_profile.last_name desc nulls last'
				},
				orders_sum: {
					asc: 'orders_stat.total_orders_sum asc nulls first',
					desc: 'orders_stat.total_orders_sum desc nulls last'
				},
				country_id: {
					asc: 'vw_country.title asc nulls first',
					desc: 'vw_country.title desc nulls last'
				},
				receive_marketing_info: {
					asc: 'person_profile.receive_marketing_info asc, person_profile.first_name asc, person_profile.last_name asc nulls last',
					desc: 'person_profile.receive_marketing_info desc, person_profile.first_name desc, person_profile.last_name desc nulls last'
				}
			}
		};
	}

	rawOptions() {
		return Object.assign(super.rawOptions(), {
			country: (this.getModel('country') as ICountryModelStatic).findCountryOptions(this.getEditingLang().lang_id, [['', this.__('All countries')]]),
			customerRole: [
				['registered', this.__('Registered Customer')],
				['guest', this.__('Guest Customer')],
			],
			subscribe: [
				['1', this.__('Yes')],
				['0', this.__('No')],
			],
			groups: (this.getModel('customerGroup') as ICustomerGroupModelStatic).findCustomerOptions([['', this.__('All groups')]])
		});
	}
}