const CategoryDataProvider = require('../admin/category');

class CategorySubMenu extends CategoryDataProvider {
	constructor(options) {
		super(options);

		this.showHidden = false;
		this.categoryId = null;

		if (options.showHidden)
			this.showHidden = true;

		if (options.categoryId)
			this.categoryId = options.categoryId;

		if (!this.categoryId)
			throw new Error('CategoryId must be passed!');
	}

	createQuery() {
		this.q.field('children.*');
		this.q.field('category_prop.show_in_parent_page_menu');

		this.q.from(`category_get_children(${this.getDb().escape(this.categoryId)})`, 'children')
		this.q.join('category_prop', null, 'category_prop.category_id = children.category_id');

		let statuses = ['published'];
		if (this.showHidden) {
			statuses.push('hidden');
		}

		this.q.where(`status in (${this.getDb().escapeIn(statuses)})`);
		this.q.where('deleted_at is null');
		this.q.where('lang_id = ?', this.getLang().lang_id);
		this.q.where('level <= 1');
	}

	prepareTreeItem(row) {
		return {
			id: row.category_id,
			title: row.title,
			url: row.custom_link || this.createUrl(row),
			// custom_link: row.custom_link,
			status: row.status,
			icon: row.icon,
			show_in_parent_page_menu: row.show_in_parent_page_menu
		}
	}

	isFilterActive() {
		return false;
	}

	rawOptions() {
		return {};
	}

	chooseParent(collection, row, i) {
		if (this.categoryId == row.parent_id) {
			return collection;
		}

		return super.chooseParent(collection, row, i);
	}
}

module.exports = CategorySubMenu;