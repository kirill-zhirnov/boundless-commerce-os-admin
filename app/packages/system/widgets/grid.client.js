import _ from 'underscore';
import Widget from '../../../modules/widget/widget.client';
import Backbone from '../../../modules/backbone/index.client';
import modalKit from '../../../modules/modal/kit.client';
import ajax from '../../../modules/ajax/kit.client';
import utils from '../../../modules/utils/common.client';
import $ from 'jquery';

const displayNone = 'd-none';
const chevronUp = 'fa-chevron-up';
const chevronDown = 'fa-chevron-down';

let GridHtmlView;
if (!process.env.__IS_SERVER__) {
	GridHtmlView = require('../../../modules/grid/views/html.client').default;
}

// To run widget you must pass at leas two params: @collection and @columns.
// @collection may be:
// - Instance of Backbone.Collection
// - {} - options of Backbone.Collection. Instance will be created
// - String - it will be used as url param for Backbone.Collection.
export default class GridWidget extends Widget {
	constructor(options) {
		super(options);

		this.columns = [];

		//		By default - remove button
		//@ts-ignore
		this.bulkButtons = {
			buttons: [
				{type: 'rm'}
			]
		};

		this.commonButtons = {
			buttons: [
				{type: 'add'}
			]
		};

		this.showPagination = true;
		this.pageSize = {
			options: {
				25: 25,
				50: 50,
				100: 100,
				500: 500
			},
			label: this.__('Show per page:'),
		};

		this.commonFilter = {showRmStatus: true};

		//		Where to export: 'csv'.
		this.export = [];

		//		can be:
		//		- modal - form will be opened in modal
		//		- page - form will be opened in new window
		this.formMode = 'modal';

		//		if @collection instance (Backbone.My.Collection) will be create by Grid, it is possible to pass @idAttribute to Model
		//		Model have to be properly configured for edit/rm buttons.
		this.idAttribute = null;
		this.staticUrls = {};

		_.extend(this, _.pick(options, ['columns', 'pageSize', 'idAttribute', 'formUrl']));

		if (!_.isUndefined(options.pageSize)) {
			//           if you want to turn off pageSize - set it to false
			if (options.pageSize === false) {
				this.pageSize = false;
			} else {
				this.pageSize = Object.assign({}, this.pageSize, options.pageSize);
			}
		}

		this.htmlView = null;

		this.parseColUrlRegExp = /^(.+)\/[^/?]+\/?(?:\?.*)?$/;

		this.className = 'grid-widget';

		this.cssGridWrapper = null;
		this.wrapperTpl = {
			type: 'widget',
			file: 'gridHtmlWrapper',
			package: 'system'
		};
	}

	initGrid() {
	}

	async runLazyInit() {
		await this.initGrid();
		await this.checkGridProps();

		try {
			await this.collection.load();
			await this.renderHtmlGridWrapper();
			await this.createHtmlView();
			this.updateAdditionalSortInHtml();
			await this.bindRefreshGridEvents();

		} catch (e) {
			console.error(e);
		}
	}

	events() {
		return {
			'click .additional-sort a': 'onAdditionalSortClicked',
			'click a[data-export]': 'onExportClicked',
			'click button[data-toggle-filter]': (e) => {
				e.preventDefault();

				const $button = $(e.currentTarget);
				const $target = $($button.data('toggle-filter'));

				const $txt = $button.find('.txt');
				const $fa = $button.find('.fa');

				if ($target.is(':visible')) {
					$txt.text(this.__('Show filters'));
					$fa.removeClass(chevronUp).addClass(chevronDown);
					$target.addClass(displayNone);
				} else {
					$txt.text(this.__('Hide filters'));
					$fa.removeClass(chevronDown).addClass(chevronUp);
					$target.removeClass(displayNone);
				}
			}
		};
	}

	// className() {
	// 	return 'grid-widget';
	// }

	renderHtmlGridWrapper() {
		const data = _.extend({
			cssGridWrapper: this.cssGridWrapper,
			exportVal: this.export,
			commonFilter: this.commonFilter
		}, this.data);

		//		we need to use original method, since in successors @package will be differ.
		return this.getView().localRender(this.wrapperTpl.type, this.wrapperTpl.file, this.prepareTplData(data), this.wrapperTpl.package)
			.then(html => {
				this.$el.html(html);
			});
	}

	createHtmlView() {
		this.htmlView = new GridHtmlView({
			gridWidget: this,
			el: this.el
		});
		this.htmlView.render();
	}

	checkGridProps() {
		this.setUpCollection();

		if (!process.env.__IS_SERVER__) {
			this.listenTo(this.collection, 'backgrid:buttonClicked', (model, $button) => {
				const method = this.getMethodByAction('onAction', $button.data('action'));

				if (_.isFunction(this[method])) {
					return this[method](model, $button);
				}
			});

			this.listenTo(this.collection, 'backgrid:bulkButtonClicked', async (models, $button) => {
				if (models.length === 0) {
					return this.getClientRegistry().getTheme().alertDanger(this.__('Please select at least one row!'));
				} else if ($button.data('action')) {
					const method = this.getMethodByAction('onBulkAction', $button.data('action'));

					if (_.isFunction(this[method])) {
						await this[method](models, $button);
						await this.$el.trigger('bulkActionCompleted.grid', [$button.data('action')]);
					}
				}
			});

			this.listenTo(this.collection, 'backgrid:commonButtonClicked', $button => {
				if ($button.data('action')) {
					const method = this.getMethodByAction('onCommonAction', $button.data('action'));

					if (_.isFunction(this[method])) {
						this[method]($button);
					}
				}
			});

			this.listenTo(this.collection, 'backgrid:onCellClick', this.onCellClick);
		}

		this.listenTo(this.collection, 'sync', this.updateAdditionalSortInHtml);
	}

	setUpCollection() {
		let ColConstructor;
		if (this.collection instanceof Backbone.Collection) {
			//			we dont do any action here
		} else if (_.isObject(this.collection)) {
			this.checkModelIdAttribute(this.collection);

			//@ts-ignore
			ColConstructor = Backbone.My.Collection.extend(this.collection);
			this.collection = this.makeBbCollection(ColConstructor);

		} else if (_.isString(this.collection)) {
			const options = {url: this.collection};
			this.checkModelIdAttribute(options);

			//@ts-ignore
			ColConstructor = Backbone.My.Collection.extend(options);
			this.collection = this.makeBbCollection(ColConstructor);

		} else {
			throw new Error('Unknown format of @collection.');
		}

		this.setupAttrsToCollection();
	}

	setupAttrsToCollection() {
		if (!this.data.attrs)
			return;

		const queryKeys = _.invert(this.collection.queryParams);
		const directionKeys = _.invert(this.collection.queryParams.directions);

		for (let attr of ['page', 'perPage', 'sortBy', 'order']) {
			if (attr in this.data.attrs) {
				let value = this.data.attrs[attr];

				if (attr === 'order') {
					value = directionKeys[this.data.attrs[attr]];
				}

				this.collection.state[queryKeys[attr]] = value;
			}
		}

		// set filter values
		const object = _.omit(this.data.attrs, ['page', 'perPage', 'sortBy', 'order']);
		for (const [key, val] of Object.entries(object)) {
			this.collection.queryParams[key] = val;
		}
	}

	checkModelIdAttribute(options) {
		if ((this.idAttribute == null) || options.model) {
			return;
		}

		//@ts-ignore
		options.model = Backbone.My.Model.extend({
			idAttribute: this.idAttribute
		});
	}

	getMethodByAction(prefix, action) {
		return `${prefix}${utils.ucfirst(action)}`;
	}

	onCellClick(model, column, e) {
		const $el = $(e.target);

		if ($el.prop('tagName').toLowerCase() === 'a') {
			return;
		}

		this.onActionEdit(model);
	}

	onActionEdit(model, $btn) {
		let url;
		if (this.formMode === 'modal') {
			url = `${this.getFormUrl()}?pk=${model.id}`;
			return modalKit.createRemote(url);
		} else {
			const params = {
				pk: model.id,
				grid: this.collection.serializeStates()
			};

			url = `${this.getFormUrl()}?${$.param(params)}`;

			return this.getClientRegistry().getClientNav().url(url);
		}
	}

	onCommonActionAdd() {
		if (this.formMode === 'modal') {
			return modalKit.createRemote(this.getFormUrl());
		} else {
			const params = {grid: this.collection.serializeStates()};

			return this.getClientRegistry().getClientNav().url(`${this.getFormUrl()}?${$.param(params)}`);
		}
	}

	onActionRm(model, $btn) {
		this.onBulkActionRm([model]);
	}

	onActionRestore(model, $btn) {
		this.onBulkActionRestore([model]);
	}

	async onBulkActionRestore(models) {
		const pk = [];
		for (const model of models) {
			pk.push(model.id);
		}

		await ajax.get(this.getStaticUrl('bulkRestore', 'bulkRestore'), {id: pk});
		await this.collection.fetch({reset: true});
	}

	onBulkActionCancel(models) {
		return this.htmlView.changeCheckedState(false);
	}

	async onBulkActionRm(models) {
		if (!confirm(this.__('Are you sure?'))) {
			return;
		}

		this.collection.remove(models);

		const pk = [];
		for (let model of models) {
			pk.push(model.id);
		}

		await ajax.get(this.getStaticUrl('bulkRm', 'bulkRm'), {id: pk});
		await this.collection.fetch({reset: true});
	}

	getStaticUrl(name, action) {
		if (!(name in this.staticUrls)) {
			this.staticUrls[name] = this.changeUrlWithNewAction(_.result(this.collection, 'url'), action);
		}

		return this.staticUrls[name];
	}

	//	it used in external classes, so it was wrapped in wrapper.
	getFormUrl() {
		return this.getStaticUrl('form', 'form');
	}

	changeUrlWithNewAction(url, action) {
		const result = url.match(this.parseColUrlRegExp);

		return `${result[1]}/${action}`;
	}

	remove() {
		if (this.htmlView) {
			this.htmlView.remove();
			this.htmlView = null;
		}

		return super.remove();
	}

	refresh() {
		return this.collection.fetch({reset: true});
	}

	bindRefreshGridEvents() {
		this.listenTo$(document, 'refresh.grid', function () {
			this.refresh();
		});
	}

	prepareBackgridOptions(options = {}) {
		return options;
	}

	updateAdditionalSortInHtml() {
		const {sortKey} = this.collection.state;
		const order = this.collection.state.order === -1 ? 'ascending' : 'descending';

		this.$('.additional-sort .item').removeClass('ascending descending');
		this.$(`.additional-sort .item[href="${sortKey}"]`).addClass(order);
	}

	onExportClicked(e) {
		e.preventDefault();

		const $el = $(e.currentTarget);

		const router = this.getClientRegistry().getRouter();
		const url = utils.concatUrl(this.getStaticUrl('export', 'export'), router.createGetStr({
			grid: this.collection.serializeStates(),
			export: $el.data('export')
		}));

		window.location = url;
	}

	onAdditionalSortClicked(e) {
		let order;
		e.preventDefault();

		const $a = $(e.currentTarget);
		const key = $a.attr('href');
		const {collection} = this.htmlView.backgrid;
		const {columns} = this.htmlView.backgrid;

		if (collection.state.sortKey === key) {
			order = collection.state.order * -1;
		} else {
			order = 1;
		}

		collection.trigger('backgrid:beforeSort', null, this.getDirectionByOrder(order));

		collection.setSorting(key, order);

		collection.fetch({
			reset: true,
			success: () => {
				const column = columns.findWhere({name: collection.state.sortKey});
				const direction = this.getDirectionByOrder(collection.state.order);

				if (column) {
					column.set('direction', direction);
					collection.trigger('backgrid:sorted', column, direction, collection);
				}
			}
		});
	}

	getDirectionByOrder(order) {
		if (order === -1) {
			return 'ascending';
		} else {
			return 'descending';
		}
	}

	getIdByModels(models, pk) {
		return _.invoke(models, 'get', pk);
	}
}

