import CharacteristicDataProvider from './characteristic';

export default class CharacteristicFilterDataProvider extends CharacteristicDataProvider {
	getRules() {
		return [
			['filterId', 'safe']
		].concat(super.getRules());
	}

	createQuery() {
		this.createBasicQuery();

		this.q.field('vw.characteristic_id');
		this.q.field('vw.title');
		this.q.field('vw.is_folder');
		this.q.field('vw.parent_id');
		this.q.field('filter_field.field_id');

		return this.q.left_join('filter_field', null, `filter_field.characteristic_id = vw.characteristic_id and filter_id = ${this.getDb().escape(this.getSafeAttr('filterId'))}`);
	}

	//@ts-ignore
	prepareData(rows) {
		const out = [];
		const checked = [];

		for (let row of Array.from(rows)) {
			if (row.field_id != null) {
				checked.push(row.characteristic_id);
			}

			if (row.is_folder) {
				out.push({
					id: row.characteristic_id,
					title: row.title,
					list: []
				});
			} else if (row.parent_id) {
				out[out.length - 1].list.push([row.characteristic_id, row.title]);
			} else {
				out.push([[row.characteristic_id, row.title]]);
			}
		}

		return {
			characteristics: out,
			checked
		};
	}
}