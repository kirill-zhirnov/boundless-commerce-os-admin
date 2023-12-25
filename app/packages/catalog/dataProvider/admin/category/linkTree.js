import CategoryDataProvider from '../category';
import _ from 'underscore';

export default class CategoryLinkTree extends CategoryDataProvider {
	constructor(...args) {
		//@ts-ignore
		super(...args);

		this.idPrefix = 'category-';
	}

	async getJsTree() {
		let out = [];

		let collection = await this.getTreeCollection();
		this.createJsTree(collection.toJSON(), out);

		return out;
	}

	createJsTree(collection, out) {
		for (let category of collection) {
			if (category.custom_link)
				continue;

			let item = {
				id: `${this.idPrefix}${category.id}`,
				text: category.title,
				data: _.pick(category, ['id', 'title', 'url']),
				state: {
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