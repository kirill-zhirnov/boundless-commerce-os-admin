import DataProvider from '../../../../modules/dataProvider';
import Backbone from '../../../../modules/backbone/index.client';
import _ from 'underscore';

export default class CategoryDataProvider extends DataProvider {
	getRules() {
		return [
			['title, inMenu, opened', 'safe']
			//@ts-ignore
		].concat(super.getRules(...arguments));
	}

	async getTreeCollection() {

		try {
			await this.validate();
		} catch (e) {
			//		don't care about the result. Promise can be resolved or rejected - don't care.
		}

		const sql = await this.createSql();

		if (!_.isObject(sql) || !sql.text || !sql.values) {
			throw new Error('createSql should return/resolve with object with: \'text\' and \'values\' props.');
		}

		const rows = await this.getDb().sql(sql.text, sql.values);

		//@ts-ignore
		const collection = new Backbone.TreeCollection();

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			//@ts-ignore
			const parent = this.chooseParent(collection, row, i);

			if (parent === false) {
				continue;
			}

			parent.add(this.prepareTreeItem(row));
		}

		return collection;
	}

	prepareTreeItem(row) {
		return {
			id: row.category_id,
			title: row.title,
			url: this.createUrl(row),
			in_menu: !!row.block_id,
			custom_link: row.custom_link,
			image: row.image_path,
			image_id: row.image_id,
			status: row.status,
			deleted_at: row.deleted_at
		};
	}

	chooseParent(collection, row) {
		if (!row.parent_id || this.isFilterActive()) {
			return collection;
		}

		const [result] = collection.where({id: row.parent_id}, {deep: true});

		return result || false;
	}

	createQuery() {
		this.q.field('vw.*');
		this.q.field('menu_block.*');
		this.q.field('category_prop.*');
		this.q.field('image.path', 'image_path');
		this.q.field('image.image_id');
		this.q.distinct();
		this.q.from('vw_category_option', 'vw');
		this.q.left_join('category_menu_rel', null, 'vw.category_id = category_menu_rel.category_id');
		this.q.left_join('menu_block', null, 'category_menu_rel.block_id = menu_block.block_id and menu_block.key = \'category\'');
		this.q.left_join('category_prop', null, 'category_prop.category_id = vw.category_id');
		this.q.left_join('image', null, 'vw.image_id = image.image_id');

		//@ts-ignore
		this.q.where('vw.site_id = ?', this.getEditingSite().site_id);
		//@ts-ignore
		this.q.where('vw.lang_id = ?', this.getEditingLang().lang_id);

		this.compareRmStatus('vw.deleted_at');

		this.compare('vw.title', this.getSafeAttr('title'), true);

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		if (attrs.inMenu && (attrs.inMenu !== '')) {
			this.q.where('menu_block.block_id is not null');
			return this.q.where('vw.status = \'published\'');
		}
	}

	sortRules() {
		return {
			default: [{tree_sort: 'asc'}],
			attrs: {
				tree_sort: 'tree_sort'
			}
		};
	}

	async createSql() {
		this.q = this.squelSelect();

		await this.createQuery();
		const sql = this.getSortSql();

		if (!this.isFilterActive() && sql) {
			this.q.order(sql, null);
		}
		return await this.q.toParam();
	}

	shallSort() {
		return true;
	}

	isFilterActive() {
		const attrs = _.pick(this.getSafeAttrs(), ['title', 'rmStatus']);

		for (let attr in attrs) {
			const val = attrs[attr];
			if (val && (val !== '0')) {
				return true;
			}
		}

		return false;
	}

	//@ts-ignore
	rawOptions() {
		return {
			menu: this.getCategoryMenuOptions()
		};
	}

	getCategoryMenuOptions() {
		const out = [['', this.__('Display in menu')]];

		// //@ts-ignore
		// const object = this.getView().getMenu();
		// for (let key in object) {
		// 	const props = object[key];
		// 	if (props.type === 'category') {
		// 		out.push([key, props.title]);
		// 	}
		// }

		return out;
	}

	createUrl(row) {
		//@ts-ignore
		return this.getModel('category').createUrl(this.getController(), row);
	}
}