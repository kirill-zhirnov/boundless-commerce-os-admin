import DataProvider from '../../../../modules/dataProvider/index';
import _ from 'underscore';
import dateExtended from 'date-extended';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';
import validator from '../../../../modules/validator/validator';

export default class ChangeQtyDataProvider extends DataProvider {
	getRules() {
		return [
			['order_id', 'isNum', {no_symbols: true}],
			['reason_id', 'inOptions', {options: 'reason'}],
			[
				'item, action, location, ts, hide_reserve',
				'safe'
			]
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const langId = this.getDb().escape(this.getEditingLang().lang_id);

		this.q.field('mi.movement_item_id');
		this.q.field('pt.title as product_title');
		this.q.field('vt.title as variant_title');
		this.q.field('vpt.title as variant_product_title');
		this.q.field('i.item_id');
		this.q.field('i.product_id');
		this.q.field('vp.product_id', 'variant_product_id');
		this.q.field('i.variant_id');
		this.q.field('from_warehouse_text.title as from_warehouse_title');
		this.q.field('to_warehouse_text.title as to_warehouse_title');
		this.q.field('mi.available_qty_diff');
		this.q.field('mi.reserved_qty_diff');
		this.q.field('m.reason_id');
		this.q.field('ot.title as reason_title');
		this.q.field('o.category', 'reason_category');
		this.q.field('o.alias', 'reason_alias');
		this.q.field('person.person_id');
		this.q.field('person.email');
		this.q.field('person_profile.first_name', 'first_name');
		this.q.field('person_profile.last_name', 'last_name');
		this.q.field('m.notes');
		this.q.field('to_char(m.ts, \'DD.MM.YYYY\') as date');
		this.q.field('to_char(m.ts, \'HH24:MI\') as time');
		this.q.field('m.ts', 'date_time');
		this.q.field('p.sku', 'product_sku');
		this.q.field('v.sku', 'variant_sku');
		this.q.field('pt.url_key', 'product_url');
		this.q.field('vpt.url_key', 'variant_product_url');
		this.q.field('image.path', 'product_img_path');
		this.q.field('image.width', 'product_img_width');
		this.q.field('image.height', 'product_img_height');
		this.q.field('variant_image.path', 'variant_img_path');
		this.q.field('variant_image.width', 'variant_img_width');
		this.q.field('variant_image.height', 'variant_img_height');
		this.q.field('coalesce(reserve.order_id, m.order_id)', 'order_id');
		this.q.field('m.props', 'movement_props');
		this.q.field('admins.is_admin');
		this.q.field('completed_transfer.transfer_id as completed_transfer_id');
		this.q.field('cancelled_transfer.transfer_id as cancelled_transfer_id');

		this.q.from('inventory_movement_item', 'mi');
		this.q.join('inventory_movement', 'm', 'mi.movement_id = m.movement_id');
		this.q.join('inventory_item', 'i', 'mi.item_id = i.item_id');
		this.q.join('inventory_option', 'o', 'm.reason_id = o.option_id');
		this.q.join('inventory_option_text', 'ot', `o.option_id = ot.option_id and ot.lang_id = ${langId}`);
		this.q.left_join('person', null, 'person.person_id = m.person_id');
		this.q.left_join('person_profile', null, 'person.person_id = person_profile.person_id');
		this.q.left_join('reserve', null, 'reserve.reserve_id = m.reserve_id');
		this.q.left_join('product', 'p', 'p.product_id = i.product_id');
		this.q.left_join('product_text', 'pt', `pt.product_id = p.product_id and pt.lang_id = ${langId}`);
		this.q.left_join('variant', 'v', 'v.variant_id = i.variant_id');
		this.q.left_join('variant_text', 'vt', `vt.variant_id = v.variant_id and vt.lang_id = ${langId}`);
		this.q.left_join('product', 'vp', 'vp.product_id = v.product_id');
		this.q.left_join('product_text', 'vpt', `vpt.product_id = vp.product_id and vpt.lang_id = ${langId}`);
		this.q.left_join('inventory_location', 'from_location', 'from_location.location_id = mi.from_location_id');
		this.q.left_join('warehouse', 'from_warehouse', 'from_warehouse.warehouse_id = from_location.warehouse_id');
		this.q.left_join(
			'warehouse_text',
			'from_warehouse_text',
			`from_warehouse.warehouse_id = from_warehouse_text.warehouse_id
				and from_warehouse_text.lang_id = ${langId}`
		);
		this.q.left_join('inventory_location', 'to_location', 'to_location.location_id = mi.to_location_id');
		this.q.left_join('warehouse', 'to_warehouse', 'to_location.warehouse_id = to_warehouse.warehouse_id');
		this.q.left_join(
			'warehouse_text',
			'to_warehouse_text',
			`to_warehouse.warehouse_id = to_warehouse_text.warehouse_id
				and to_warehouse_text.lang_id = ${langId}`
		);

		this.q.left_join(
			'product_image',
			null,
			'product_image.product_id = p.product_id and product_image.is_default is true'
		);
		this.q.left_join('image', null, 'image.image_id = product_image.image_id');
		this.q.left_join(
			'product_image',
			'variant_product_image',
			`variant_product_image.product_id = vp.product_id
				and variant_product_image.is_default is true`
		);
		this.q.left_join('image', 'variant_image', 'variant_image.image_id = variant_product_image.image_id');
		this.q.left_join(`
			(
				select
					distinct
					person_id,
					true as is_admin
				from
					person_role_rel
				inner join role using(role_id)
				where
					alias = 'admin'
			)
		`, 'admins', 'admins.person_id = person.person_id');
		this.q.left_join('transfer', 'completed_transfer', 'completed_transfer.completed_movement_id = m.movement_id');
		this.q.left_join('transfer', 'cancelled_transfer', 'cancelled_transfer.cancelled_movement_id = m.movement_id');
		this.q.where('i.custom_item_id is null');

		const attrs = this.getSafeAttrs();

		//		item:
		//@ts-ignore
		attrs.item = attrs.item || '';
		//@ts-ignore
		const item = validator.trim(attrs.item);
		//@ts-ignore
		if (attrs.item && (item !== '')) {
			let intItem = parseInt(item);
			intItem = isNaN(intItem) ? 0 : intItem;

			const itemTitle = `%${item}%`;
			this.q.where(`
				i.product_id = ?
				or vp.product_id = ?
				or p.sku like ?
				or v.sku like ?
				or pt.title like ?
				or vt.title like ?
			`, intItem, intItem, itemTitle, itemTitle, itemTitle, itemTitle);
		}

		//@ts-ignore
		if (attrs.action) {
			//@ts-ignore
			attrs.hide_reserve = false;
			//@ts-ignore
			switch (attrs.action) {
				case 'income':
					this.q.where(`
						(
							o.category = 'changeQty'
							or (
								o.category = 'systemChangeQty'
								and o.alias in ('importChangeQty', 'editProductForm')
							)
						)
						and mi.available_qty_diff > 0
					`);
					break;
				case 'write_off':
					this.q.where(`
						(
							o.category = 'changeQty'
							or (
								o.category = 'systemChangeQty'
								and o.alias in ('importChangeQty', 'editProductForm')
							)
						)
						and mi.available_qty_diff < 0
					`);
					break;
				case 'reserve':
					this.q.where(`
						o.category = 'systemChangeQty'
						and o.alias in ('availableToReserve', 'reserveSetQty')
						and mi.reserved_qty_diff > 0
					`
					);
					break;
				case 'cancel_reserve':
					this.q.where(`
						o.category = 'systemChangeQty'
						and o.alias in ('rmFromReserve', 'reserveSetQty')
						and mi.reserved_qty_diff < 0
					`);
					break;
				case 'selling':
					this.q.where(`
						o.category = 'systemChangeQty'
						and o.alias in ('reservedToOutside', 'availableToOutside')
					`);
					break;
				case 'cancelShipping':
					this.q.where('o.category = \'systemChangeQty\' and o.alias = \'outsideToReserved\'');
					break;
				case 'refund':
					this.q.where('o.category = \'systemChangeQty\' and o.alias = \'outsideToAvailable\'');
					break;
				case 'warehouseMovement':
					this.q.where('o.category = \'systemChangeQty\' and o.alias = \'warehouseMovement\'');
					break;
			}
		}

		//@ts-ignore
		if (attrs.location) {
			//@ts-ignore
			this.q.where('mi.from_location_id = ? or mi.to_location_id = ?', attrs.location, attrs.location);
		}

		//@ts-ignore
		if (attrs.order_id) {
			//@ts-ignore
			this.q.where('reserve.order_id = ? or m.order_id = ?', attrs.order_id, attrs.order_id);
		}

		//@ts-ignore
		this.compare('m.reason_id', attrs.reason_id);

		//@ts-ignore
		const tsParsed = this.parseDate4Filter(attrs.ts);
		if (tsParsed !== false) {
			this.q.where('m.ts >= ? and m.ts < ?', dateExtended.format(tsParsed[0], 'yyyy-MM-dd'), dateExtended.format(tsParsed[1], 'yyyy-MM-dd'));
		}

		//@ts-ignore
		if (attrs.hide_reserve === '1') {
			return this.q.where(`
				o.alias not in ('availableToReserve', 'rmFromReserve', 'reserveSetQty')
				or o.alias is null
			`);
		}
	}

	sortRules() {
		return {
			default: [{ts: 'desc'}],
			attrs: {
				ts: {
					desc: 'm.ts desc, mi.movement_item_id desc',
					asc: 'm.ts asc, mi.movement_item_id asc'
				},

				item: 'coalesce(vpt.title, pt.title)'
			}
		};
	}

	prepareData(rows) {
		return [this.getMetaResult(), this.prepareRows(rows)];
	}

	prepareRows(rows) {
		const VariantModel = this.getModel('variant');

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];




			if (row.product_id != null) {
				//@ts-ignore
				const {product_id, product_title, product_sku, product_url, product_img_path, product_img_width, product_img_height} = row;
				_.extend(row, {
					type: 'product',
					title: product_title,
					sku: product_sku,
					product_id: product_id,
					product_url: product_url,
					img_path: product_img_path,
					img_width: product_img_width,
					img_height: product_img_height
				});
			} else {
				//@ts-ignore
				const {
					variant_product_title, variant_title, variant_sku, variant_product_id, variant_product_url,
					variant_img_path, variant_img_width, variant_img_height
				} = row;
				_.extend(row, {
					type: 'variant',
					//@ts-ignore
					title: VariantModel.getVariantTitleByRow(row),
					product_title: variant_product_title,
					variant_title: variant_title,
					sku: variant_sku,
					product_id: variant_product_id,
					product_url: variant_product_url,
					img_path: variant_img_path,
					img_width: variant_img_width,
					img_height: variant_img_height
				});
			}

			//@ts-ignore
			if (row.img_path) {
				//@ts-ignore
				row.thumb200 = thumbnailUrl.getAttrs(this.getInstanceRegistry(), {
					//@ts-ignore
					path: row.img_path,
					//@ts-ignore
					width: row.img_width,
					//@ts-ignore
					height: row.img_height
				}, 'scaled', 's');
			}

			//@ts-ignore
			row.url = this.url('@product', {
				//@ts-ignore
				id: row.product_url ? row.product_url : row.product_id
			});

			//@ts-ignore
			row.person = row.email;
			//@ts-ignore
			if (row.first_name || row.last_name) {
				//@ts-ignore
				row.person = `${row.first_name} ${row.last_name}`;
			}

			_.extend(row, this.identifyRowAction(row));

			rows[i] = _.omit(row, [
				'product_url',
				'variant_product_id',
				'variant_product_title',
				'variant_product_url',
				'product_img_path',
				'product_img_width',
				'product_img_height',
				'variant_img_path',
				'variant_img_width',
				'variant_img_height',
				'product_sku',
				'variant_sku',
			]);
		}

		return rows;
	}

	identifyRowAction(row) {
		//@ts-ignore
		const category = row.reason_category;
		//@ts-ignore
		const alias = row.reason_alias;
		//@ts-ignore
		const availableDiff = row.available_qty_diff;
		//@ts-ignore
		const reservedDiff = row.reserved_qty_diff;

		const out = {
			action: null,
			groupedAction: null
		};

		if (((category === 'changeQty') || ((category === 'systemChangeQty') && ['importChangeQty', 'editProductForm'].includes(alias))) && (availableDiff > 0)) {
			out.action = 'income';
			out.groupedAction = 'income';
		}

		if (((category === 'changeQty') || ((category === 'systemChangeQty') && ['importChangeQty', 'editProductForm'].includes(alias))) && (availableDiff < 0)) {
			out.action = 'write_off';
			out.groupedAction = 'write_off';
		}

		if ((category === 'systemChangeQty') && ['availableToReserve', 'reserveSetQty'].includes(alias) && (reservedDiff > 0)) {
			out.action = 'reserve';
			out.groupedAction = 'reserve';
		}

		if ((category === 'systemChangeQty') && ['rmFromReserve', 'reserveSetQty'].includes(alias) && (reservedDiff < 0)) {
			out.action = 'cancel_reserve';
			out.groupedAction = 'reserve';
		}

		if ((category === 'systemChangeQty') && ['reservedToOutside', 'availableToOutside'].includes(alias)) {
			out.action = 'selling';
			out.groupedAction = 'write_off';
		}

		if ((category === 'systemChangeQty') && (alias === 'outsideToReserved')) {
			out.action = 'cancelShipping';
		}

		if ((category === 'systemChangeQty') && (alias === 'outsideToAvailable')) {
			out.action = 'refund';
			out.groupedAction = 'income';
		}

		if ((category === 'systemChangeQty') && (alias === 'warehouseMovement')) {
			out.action = 'warehouseMovement';
			out.groupedAction = 'transfer';
		}

		return out;
	}

	//@ts-ignore
	rawOptions() {
		return {
			//@ts-ignore
			location: this.getModel('inventoryLocation').getWarehouseOptions(this.getEditingLang().lang_id, [['', this.__('All warehouses')]]),
			//@ts-ignore
			reason: this.getModel('inventoryOption').getOptions('changeQty', this.getEditingLang().lang_id, [['', this.__('All')]]),
			action: this.getActionOptions()
		};
	}

	async getTplData() {
		let out = null;

		const data = await super.getTplData();

		out = data;

		//@ts-ignore
		if (_.isUndefined(data.attrs.hide_reserve)) {
			//@ts-ignore
			data.attrs.hide_reserve = '1';
		}

		//@ts-ignore
		out.orderStatus = await this.getOrderStatus();

		return out;
	}

	getActionOptions() {
		return [
			['', this.__('All')],
			['income', this.__('Income of products')],
			['write_off', this.__('Write-off of products')],
			['reserve', this.__('Reserve product')],
			['cancel_reserve', this.__('Cancel reserve')],
			['selling', this.__('Selling or shipping')],
			['cancelShipping', this.__('Cancel shipping')],
			['refund', this.__('Refund')],
			['warehouseMovement', this.__('Warehouse movements')]
		];
	}

	async getOrderStatus() {
		const rows = await this.getDb().sql(`
			select
				status_id,
				title
			from
				order_status
			inner join order_status_text using(status_id)
			where
				lang_id = :lang
		`, {
			lang: this.getEditingLang().lang_id
		});

		const out = {};
		for (let row of Array.from(rows)) {
			//@ts-ignore
			out[row.status_id] = row.title;
		}

		return out;
	}
}