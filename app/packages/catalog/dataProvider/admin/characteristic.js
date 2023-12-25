import DataProvider from '../../../../modules/dataProvider/index';

export default class CharacteristicDataProvider extends DataProvider {
	getRules() {
		return [
			['groupId', 'required'],
			['groupId', 'isNumeric'],
			['title', 'safe']
		//@ts-ignore
		].concat(super.getRules());
	}

	prepareData(rows) {
		const out = [];
		const titles = {};

		for (let row of Array.from(rows)) {
			titles[row.characteristic_id] = row.title;

			out.push({
				characteristic_id: row.characteristic_id,
				parent_id: row.parent_id,
				joined_title: row.joined_title,
				title: row.title,
				parent_title: row.parent_title,
				is_folder: row.is_folder,
				sort: row.sort,
				type: row.type,
				system_type: row.system_type,
				alias: row.alias
			});
		}

		return [this.getMetaResult(), out];
	}

	createQuery() {
		this.createBasicQuery();

		return this.q.where('vw.system_type not in (?, ?, ?, ?, ?) or vw.system_type is null', 'size', 'length', 'width', 'height', 'weight');
	}

	createBasicQuery() {
		this.q.from('vw_characteristic_grid', 'vw');
		this.q.where('vw.lang_id = ?', this.getEditingLang().lang_id);

		const groupId = this.getSafeAttr('groupId');
		if (!groupId) {
			throw new Error('GroupId cannot be empty!');
		}

		this.compare('vw.group_id', groupId);
		this.compare('vw.joined_title', this.getSafeAttr('title'), true);

		return this.q.order('vw.tree_sort');
	}
}