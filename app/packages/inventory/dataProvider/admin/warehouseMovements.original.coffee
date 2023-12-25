pathAlias = require 'path-alias'
DataProvider = pathAlias '@modules/dataProvider/index'
moment = require 'moment'

class WarehouseMovementsDataProvider extends DataProvider
	constructor : (options = {}) ->
		super

		@validPageSize = [100, 500, false]

		@defaults =
			rmStatus : 0
			perPage : 100

	getRules: ->
		return [
			['id, l_from, l_to, sum, qty', 'safe']
		].concat(super)

	createQuery: ->
		langId = @getDb().escape @getEditingLang().lang_id
				
		@q.field 'transfer.transfer_id'
		@q.field "to_char(transfer.created_at, 'DD.MM.YYYY') as created_date"
		@q.field "to_char(transfer.created_at, 'HH24:MI') as created_time"
		@q.field 'transfer.status'
		@q.field 'transfer.movement_comment'
		@q.field 'transfer.created_at'
		@q.field 'from_warehouse_txt.title as l_from'
		@q.field 'to_warehouse_txt.title as l_to'
		@q.field 'stat.sum'
		@q.field 'stat.qty'
		
#		Completed movement:
		@q.field 'completed_movement.person_id as completed_person_id'
		@q.field 'completed_person.email as completed_email'
		@q.field 'completed_person_profile.first_name as completed_first_name'
		@q.field 'completed_person_profile.last_name as completed_last_name'
		@q.field "to_char(completed_movement.ts, 'DD.MM.YYYY HH24:MI') as completed_ts"
#		Cancelled movement:
		@q.field 'cancelled_movement.person_id as cancelled_person_id'
		@q.field 'cancelled_person.email as cancelled_email'
		@q.field 'cancelled_person_profile.first_name as cancelled_first_name'
		@q.field 'cancelled_person_profile.last_name as cancelled_last_name'
		@q.field "to_char(cancelled_movement.ts, 'DD.MM.YYYY HH24:MI') as cancelled_ts"
		
		@q.from 'transfer'
		@q.join("(
			select
				transfer_id,
				sum(transfer_item.qty * coalesce(vw_inventory_item.price, 0)) as sum,
				sum(transfer_item.qty) as qty
			from
				transfer_item
				left join vw_inventory_item using(item_id)
			group
				by transfer_id
		)", 'stat', 'stat.transfer_id = transfer.transfer_id')
		
#		warehouses:
		@q.left_join 'inventory_location', 'from_loc', 'from_loc.location_id = transfer.from_location_id'
		@q.left_join 'warehouse', 'from_warehouse', 'from_loc.warehouse_id = from_warehouse.warehouse_id'
		@q.left_join "warehouse_text", "from_warehouse_txt", "from_warehouse.warehouse_id = from_warehouse_txt.warehouse_id and from_warehouse_txt.lang_id = #{langId}"
		@q.left_join 'inventory_location', 'to_loc', 'to_loc.location_id = transfer.to_location_id'
		@q.left_join 'warehouse', 'to_warehouse', 'to_loc.warehouse_id = to_warehouse.warehouse_id'
		@q.left_join "warehouse_text", "to_warehouse_txt", "to_warehouse.warehouse_id = to_warehouse_txt.warehouse_id and to_warehouse_txt.lang_id = #{langId}"
		
#		completed:
		@q.left_join 'inventory_movement', 'completed_movement', 'completed_movement.movement_id = transfer.completed_movement_id'
		@q.left_join 'person', 'completed_person', 'completed_movement.person_id = completed_person.person_id'
		@q.left_join 'person_profile', 'completed_person_profile', 'completed_person_profile.person_id = completed_person.person_id'
		
#		cancelled:
		@q.left_join 'inventory_movement', 'cancelled_movement', 'cancelled_movement.movement_id = transfer.cancelled_movement_id'
		@q.left_join 'person', 'cancelled_person', 'cancelled_movement.person_id = cancelled_person.person_id'
		@q.left_join 'person_profile', 'cancelled_person_profile', 'cancelled_person_profile.person_id = cancelled_person.person_id'
		
		@compareNumber 'transfer.transfer_id', @getSafeAttr('id')
		@compare 'from_loc.location_id', @getSafeAttr('l_from')
		@compare 'to_loc.location_id', @getSafeAttr('l_to')
		
		@compareNumber 'stat.sum', @getSafeAttr('sum')
		@compareNumber 'stat.qty', @getSafeAttr('qty')
	
	prepareData : (rows) ->
		for row, i in rows
			if row.completed_person_id
				row.completed_full_name = @getPersonName row.completed_email, row.completed_first_name, row.completed_last_name
			
			if row.cancelled_person_id
				row.cancelled_full_name = @getPersonName row.cancelled_email, row.cancelled_first_name, row.cancelled_last_name
				
			rows[i] = row
			
		return super
		
	getPersonName : (email, firstName, lastName) ->
		out = email
		
		name = []
		if firstName
			name.push firstName
		
		if lastName
			name.push lastName
		
		if name.length
			out = name.join ' '
			
		return out
		
	sortRules: ->
		return {
			default: [{id: 'desc'}]
			attrs:
				id : 'transfer.created_at'
				status : 'transfer.status'
				l_from : 'from_warehouse_txt.title'
				l_to : 'to_warehouse_txt.title'
				qty : 'stat.qty'
				sum : 'stat.sum'
		}
	
	rawOptions: ->
		return {
			location : @getModel('inventoryLocation').getWarehouseOptions @getEditingLang().lang_id, [['', @__('All')]]
		}

module.exports = WarehouseMovementsDataProvider
