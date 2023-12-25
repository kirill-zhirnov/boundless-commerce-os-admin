import CategoryDataProvider from '../category';

export default class CategoryParentTree extends CategoryDataProvider {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.idPrefix = 'category-';
	}

	getRules() {
		return [
			['parent_id', 'isNum']
		].concat(super.getRules());
	}

	async getJsTree() {
		let out = [],
			root = {
				id: 0,
				text: this.__('Catalog'),
				data: {
					category_id: 0
				},
				state: {
					//@ts-ignore
					selected: (this.attributes.parent_id == '0'),
					opened: true
				},
				children: []
			}
			;
		out.push(root);

		let collection = await this.getTreeCollection();
		this.createJsTree(collection.toJSON(), root.children);

		return out;
	}

	createJsTree(collection, out) {
		let parentId = this.getSafeAttr('parent_id');

		for (let category of collection) {
			let item = {
				id: `${this.idPrefix}${category.id}`,
				text: category.title,
				data: {
					category_id: category.id
				},
				state: {
					selected: (parentId == category.id)
				}
			};

			if (item.state.selected)
				item.state.opened = true;

			if (Array.isArray(category.nodes) && category.nodes.length) {
				item.children = [];
				this.createJsTree(category.nodes, item.children);
			}

			out.push(item);
		}

		return out;
	}
}