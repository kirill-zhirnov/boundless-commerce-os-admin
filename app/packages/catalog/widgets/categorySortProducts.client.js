import Widget from '../../../modules/widget/widget.client';
import Backbone from '../../../modules/backbone/index.client';
import ajax from '../../../modules/ajax/kit.client';
import $ from 'jquery';

export default class CategorySortProducts extends Widget {
	constructor(options) {
		super(options);

		const ColConstructor = Backbone.My.Collection.extend({
			url: this.url('catalog/admin/category/products/collection', {category: this.data.categoryId})
		});
		this.collection = this.makeBbCollection(ColConstructor);

		this.sortByPages = {};

		let sortableInited = false;
		this.listenTo(this.collection, 'sync', function() {
			this.sortByPages[this.collection.state.currentPage] = this.collection.pluck('product_id');
			this.renderToWrapper('categorySortProducts', {
				rawCollection: this.collection
			})
				.then(() => {
					if (!sortableInited)
						this.setupSortable();

					this.onSortCheckbox();
				});
		});
	}

	run() {
		return this.resolveEmpty();
	}

	runLazyInit() {
		this.collection.load();
		// this.listenTo$(document, 'show.bs.tab', 'a[href="#products"]', (e) => {
		// 	if (!this.collection.length)
		// 		this.collection.load();
		// });
	}

	events() {
		return {
			'click .pagination-widget a[data-page]': (e) => {
				e.preventDefault();
				e.stopPropagation();

				this.collection.getPage($(e.currentTarget).data('page'));
			},

			'input .sort-checkbox input': () => {
				this.onSortCheckbox();
			},

			'click .move-to-top': (e) => {
				e.preventDefault();

				let postData = this.$('input.to-begin:checked').serializeArray();
				postData.push(
					{name: 'category', value: this.data.categoryId},
					{name: 'moveToTop', value: 1}
				);

				ajax.post(this.url('catalog/admin/category/products/sort'), postData)
					.then(() => {
						this.sortByPages = {};
						this.collection.getPage(1, {reset: true});
					});
			},

			'click .use-default': (e) => {
				e.preventDefault();

				ajax.post(this.url('catalog/admin/category/products/resetSort'), {
					category: this.data.categoryId
				})
					.then(() => {
						this.sortByPages = {};
						this.collection.getPage(1, {reset: true});
					});
			}
		};
	}

	setupSortable() {
		this.$('.products').sortable({
			placeholder: 'sortable-placeholder',
			stop: () => {
				this.saveSort();
			}
		});
	}

	saveSort() {
		let sort = [],
			page = this.collection.state.currentPage
		;

		this.$('.products > li').each((i, el) => {
			sort.push($(el).data('id'));
		});

		this.sortByPages[page] = sort;

		let postSort = [];
		for (let i=1; i <= page; i++) {
			postSort = postSort.concat(this.sortByPages[i]);
		}

		ajax.post(this.url('catalog/admin/category/products/sort'), {
			products: postSort,
			category: this.data.categoryId
		});
	}

	onSortCheckbox() {
		this.$('.move-to-top').attr(
			'disabled',
			!this.$('input.to-begin:checked').length
		);
	}

	getFileName() {
		return __filename;
	}
}