import ChangeQtyDataProvider from './changeQty';

export default class MovementItem extends ChangeQtyDataProvider {
	getRules() {
		return [
			['movement_item_id', 'safe']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		super.createQuery();

		return this.q.where(`mi.movement_id = (
			select
				movement_id
			from
				inventory_movement_item
			where
				movement_item_id = ?
		)`, this.getSafeAttr('movement_item_id'));
	}

	async loadMovement() {
		const [row] = await this.getDb().sql(`
			select
				distinct
				m.notes,
				to_char(m.ts, :dateFormat) as ts,
				ot.title as reason,
				p.email,
				coalesce(i.product_id, v.product_id) as product_id
			from
				inventory_movement m
			inner join inventory_movement_item mi on m.movement_id = mi.movement_id
			inner join inventory_option o on o.option_id = m.reason_id
			inner join inventory_option_text ot on ot.option_id = o.option_id and ot.lang_id = :lang
			left join person p on p.person_id = m.person_id
			inner join inventory_item i on i.item_id = mi.item_id
			left join variant v on v.variant_id = i.variant_id
			where
				mi.movement_item_id = :id
		`, {
			dateFormat: 'DD.MM.YYYY HH24:MI',
			id: this.pk,
			lang: this.getEditingLang().lang_id
		});

		if (!row) {
			throw new Error(`Movement item with ID '${this.pk}' not found!`);
		}

		return row;
	}

	getPageSize() {
		return false;
	}

	async getTplData() {
		const out = await super.getTplData();
		//@ts-ignore
		out.movementItemId = this.pk;
		//@ts-ignore
		out.attrs = {};

		//@ts-ignore
		out.movement = await this.loadMovement();

		return out;
	}
}