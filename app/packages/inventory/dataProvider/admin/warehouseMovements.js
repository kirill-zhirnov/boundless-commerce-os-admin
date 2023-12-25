import DataProvider from '../../../../modules/dataProvider/index';

export default class WarehouseMovementsDataProvider extends DataProvider {
	constructor(options) {
		if (options == null) {options = {};}
		super(options);

		this.validPageSize = [100, 500, false];

		this.defaults = {
			rmStatus: 0,
			perPage: 100
		};
	}

	getRules() {
		return [
			['id, l_from, l_to, sum, qty', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const langId = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.field('transfer.transfer_id');
		this.q.field('to_char(transfer.created_at, \'DD.MM.YYYY\') as created_date');
		this.q.field('to_char(transfer.created_at, \'HH24:MI\') as created_time');
		this.q.field('transfer.status');
		this.q.field('transfer.movement_comment');
		this.q.field('transfer.created_at');
		this.q.field('from_warehouse_txt.title as l_from');
		this.q.field('to_warehouse_txt.title as l_to');
		this.q.field('stat.sum');
		this.q.field('stat.qty');

		//		Completed movement:
		this.q.field('completed_movement.person_id as completed_person_id');
		this.q.field('completed_person.email as completed_email');
		this.q.field('completed_person_profile.first_name as completed_first_name');
		this.q.field('completed_person_profile.last_name as completed_last_name');
		this.q.field('to_char(completed_movement.ts, \'DD.MM.YYYY HH24:MI\') as completed_ts');
		//		Cancelled movement:
		this.q.field('cancelled_movement.person_id as cancelled_person_id');
		this.q.field('cancelled_person.email as cancelled_email');
		this.q.field('cancelled_person_profile.first_name as cancelled_first_name');
		this.q.field('cancelled_person_profile.last_name as cancelled_last_name');
		this.q.field('to_char(cancelled_movement.ts, \'DD.MM.YYYY HH24:MI\') as cancelled_ts');

		this.q.from('transfer');
		this.q.join(`(
			select
				transfer_id,
				sum(transfer_item.qty * coalesce(vw_inventory_item.price, 0)) as sum,
				sum(transfer_item.qty) as qty
			from
				transfer_item
			left join vw_inventory_item using(item_id)
			group
				by transfer_id
		)`, 'stat', 'stat.transfer_id = transfer.transfer_id');

		//		warehouses:
		this.q.left_join('inventory_location', 'from_loc', 'from_loc.location_id = transfer.from_location_id');
		this.q.left_join('warehouse', 'from_warehouse', 'from_loc.warehouse_id = from_warehouse.warehouse_id');
		this.q.left_join('warehouse_text', 'from_warehouse_txt', `from_warehouse.warehouse_id = from_warehouse_txt.warehouse_id and from_warehouse_txt.lang_id = ${langId}`);
		this.q.left_join('inventory_location', 'to_loc', 'to_loc.location_id = transfer.to_location_id');
		this.q.left_join('warehouse', 'to_warehouse', 'to_loc.warehouse_id = to_warehouse.warehouse_id');
		this.q.left_join('warehouse_text', 'to_warehouse_txt', `to_warehouse.warehouse_id = to_warehouse_txt.warehouse_id and to_warehouse_txt.lang_id = ${langId}`);

		//		completed:
		this.q.left_join('inventory_movement', 'completed_movement', 'completed_movement.movement_id = transfer.completed_movement_id');
		this.q.left_join('person', 'completed_person', 'completed_movement.person_id = completed_person.person_id');
		this.q.left_join('person_profile', 'completed_person_profile', 'completed_person_profile.person_id = completed_person.person_id');

		//		cancelled:
		this.q.left_join('inventory_movement', 'cancelled_movement', 'cancelled_movement.movement_id = transfer.cancelled_movement_id');
		this.q.left_join('person', 'cancelled_person', 'cancelled_movement.person_id = cancelled_person.person_id');
		this.q.left_join('person_profile', 'cancelled_person_profile', 'cancelled_person_profile.person_id = cancelled_person.person_id');

		this.compareNumber('transfer.transfer_id', this.getSafeAttr('id'));
		this.compare('from_loc.location_id', this.getSafeAttr('l_from'));
		this.compare('to_loc.location_id', this.getSafeAttr('l_to'));

		this.compareNumber('stat.sum', this.getSafeAttr('sum'));
		return this.compareNumber('stat.qty', this.getSafeAttr('qty'));
	}

	prepareData(rows) {
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (row.completed_person_id) {
				row.completed_full_name = this.getPersonName(row.completed_email, row.completed_first_name, row.completed_last_name);
			}

			if (row.cancelled_person_id) {
				row.cancelled_full_name = this.getPersonName(row.cancelled_email, row.cancelled_first_name, row.cancelled_last_name);
			}

			rows[i] = row;
		}

		return super.prepareData(rows);
	}

	getPersonName(email, firstName, lastName) {
		let out = email;

		const name = [];
		if (firstName) {
			name.push(firstName);
		}

		if (lastName) {
			name.push(lastName);
		}

		if (name.length) {
			out = name.join(' ');
		}

		return out;
	}

	sortRules() {
		return {
			default: [{id: 'desc'}],
			attrs: {
				id: 'transfer.created_at',
				status: 'transfer.status',
				l_from: 'from_warehouse_txt.title',
				l_to: 'to_warehouse_txt.title',
				qty: 'stat.qty',
				sum: 'stat.sum'
			}
		};
	}

	//@ts-ignore
	rawOptions() {
		return {
			//@ts-ignore
			location: this.getModel('inventoryLocation').getWarehouseOptions(this.getEditingLang().lang_id, [['', this.__('All')]])
		};
	}
}