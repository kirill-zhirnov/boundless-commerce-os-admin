const PageDataProvider = require('../page');
const _ = require('underscore');

class PageJsTreeLinks extends PageDataProvider {
	constructor(...args) {
		super(...args);

		this.idPrefix = 'page-';
	}

	async getJsTree() {
		let out = [];

		let pages = {
			id: 0,
			text: this.__('Pages'),
			data: {
				id: -1
			},
			state: {checkbox_disabled: true},
			a_attr: {class: "no-checkbox"},
			children: []
		};

		this.type = 'page';
		let pagesCollection = await this.getTreeCollection();
		this.createJsTree(pagesCollection.toJSON(), pages.children);
		out.push(pages);

		let landings = {
			id: 0,
			text: this.__('Landings'),
			data: {
				id: -2
			},
			state: {checkbox_disabled: true},
			a_attr: {class: "no-checkbox"},
			children: []
		};

		this.type = 'landing';
		let landingsCollection = await this.getTreeCollection();
		this.createJsTree(landingsCollection.toJSON(), landings.children);
		out.push(landings);

		return out;
	}

	createJsTree(collection, out) {
		for (let page of collection) {
			let item = {
				id: `${this.idPrefix}${page.id}`,
				text: page.title,
				data: _.pick(page, ['id', 'title', 'type', 'url']),
				state: {
				}
			};

			if (page.type == 'folder') {
				Object.assign(item.state, {
					checkbox_disabled: true
				});

				item.a_attr = {class: "no-checkbox"};
			}

			if (Array.isArray(page.nodes) && page.nodes.length) {
				item.children = [];
				this.createJsTree(page.nodes, item.children);
			}

			out.push(item);
		}

		return out;
	}
}

module.exports = PageJsTreeLinks;