import Widget from '../../../modules/widget/widget.client';
import _ from 'underscore';
import $ from 'jquery';

export default class Pagination extends Widget {
	constructor(options) {
		super(options);

		_.defaults(this.data, {
			config: {},
			basicUrl: null,
			urlParams: {}
		});

		_.defaults(this.data.config, {
//			pages in range:
			rangeSize: 10
		});

		this.tagName = 'nav';
	}

	run() {
		if (!this.collection) {
			throw new Error('Not instance of Collection');
		}

		return this.render('pagination', _.extend({
				pagesInRange: this.getPagesInRange(),
				createPageUrl: this.createPageUrl.bind(this)
			}, this.collection.state)
		);
	}

	events() {
		return {
			'click a': 'onLinkClicked'
		};
	}

	onLinkClicked(e) {
		const $a = $(e.currentTarget);
		const $li = $a.parents('li:eq(0)');

		if ($li.hasClass('disabled')) {
			e.preventDefault();
			return;
		}
	}

	getPagesInRange() {
		let page;
		let asc;
		const leftSize = Math.ceil(this.data.config.rangeSize / 2);

		const out = [];
		let i = 0;
		for (page = this.collection.state.currentPage, asc = this.collection.state.currentPage <= 1; asc ? page <= 1 : page >= 1; asc ? page++ : page--) {
			out.unshift(page);

			i++;

			if (i >= leftSize) {
				break;
			}
		}

		if (this.collection.state.totalPages > i) {
			const rightSize = this.data.config.rangeSize - i;
			let start = this.collection.state.currentPage + 1;

			if (start <= this.collection.state.totalPages) {
				let asc1, end1, start1;
				i = 0;
				for (start1 = this.collection.state.currentPage + 1, page = start1, end1 = this.collection.state.totalPages, asc1 = start1 <= end1; asc1 ? page <= end1 : page >= end1; asc1 ? page++ : page--) {
					out.push(page);

					i++;

					if (i >= rightSize) {
						break;
					}
				}
			}

			const needToFill = this.data.config.rangeSize - out.length;
			if (needToFill > 0) {
				start = out[0] - 1;
				let end = (start - needToFill) + 1;
				end = end < 1 ? 1 : end;

				if (start > 0) {
					let asc2, end2;
					for (page = start, end2 = end, asc2 = start <= end2; asc2 ? page <= end2 : page >= end2; asc2 ? page++ : page--) {
						out.unshift(page);
					}
				}
			}
		}

		return out;
	}

	getBasicUrl() {
		let url;
		if (this.data.basicUrl) {
			url = this.data.basicUrl;
		} else {
			url = _.result(this.collection, 'url');
		}

		if (url.charAt(0) === '/') {
			url = url.substr(1);
		}

		return url;
	}

	createPageUrl(page) {
		const params = {};
		if (page > 1) {
			params.page = page;
		}


		return this.url(this.getBasicUrl(), _.extend(params, this.data.urlParams));
	}

	attributes() {
		return {
			class: 'pagination-widget'
		};
	}

	getFileName() {
		return __filename;
	}
}
