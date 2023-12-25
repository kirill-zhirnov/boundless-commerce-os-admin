// @ts-nocheck
import _ from 'underscore';
import MyBackboneView from '../../backbone/my/view.client';
import Backgrid from '../views/html/backgrid.client';
import {clientRegistry} from '../../registry/client/client.client';
import $ from 'jquery';
import CommonButtons from './html/commonButtons.client';
import CommonFilter from './commonFilter.client';
import * as bulkButtonsKit from '../../bulkButtons/kit.client';

export default class GridHtmlView extends MyBackboneView {
	constructor(options = {}) {
		super(options);

		_.extend(this, _.pick(options, ['gridWidget', '$gridWrapper']));

		if (!(this.gridWidget)) {
			throw new Error('You must pass instance of GridWidget!');
		}

		this.backgrid = null;
		this.paginator = null;
		this.commonButtons = null;
		this.bulkButtons = null;
		this.bulkCheckboxKey = null;
		this.commonFilters = [];

		if (!this.$gridWrapper) {
			this.$gridWrapper = this.$el.find('.grid:eq(0)');
		}

		this.setupBackgrid();
		this.setupPaginator();
		this.setupBulkButtons();
		this.setupCommonFilter();
		this.setupBulkEvents();
	}

	render() {
		const $tableResponsive = $('<div class="table-responsive"></div>');
		$tableResponsive.append(this.backgrid.render().el);

		this.$gridWrapper.append($tableResponsive);

		if (this.gridWidget.showPagination) {
			this.$gridWrapper.append(this.paginator.render().el);
		}

		if (this.backgrid.header.filterRow.isVisible()) {
			return this.backgrid.header.filterRow.initCollectionQueryParams();
		}
	}

	setupPaginator() {
		const paginatorConfig = {collection: this.gridWidget.collection};

		if (this.gridWidget.pageSize) {
			paginatorConfig.pageSizeSelector = new Backgrid.Extension.PageSizeSelector(_.extend(this.gridWidget.pageSize, {
				collection: this.gridWidget.collection,
				selectClassName: 'form-select form-select-sm'
			}));
		}

		return this.paginator = new Backgrid.Extension.Paginator(paginatorConfig);
	}

	setupBackgrid() {
		return this.backgrid = new Backgrid.Grid(this.getBackgridOptions());
	}

	setupCommonFilter() {
		this.$('form.filter').each((i, el) => {
			this.commonFilters.push(
				new CommonFilter({
					el,
					collection: this.gridWidget.collection,
					// $filterToggle: this.$('.filter-toggle')
				})
			);
		});
	}

	setupBulkButtons() {
		this.commonButtons = new CommonButtons(_.extend({
				el: this.gridWidget.$('div[data-role="common"]').get(0)
			}, this.gridWidget.commonButtons)
		);
		this.commonButtons.render();

		this.bulkButtons = bulkButtonsKit.create(this.gridWidget.bulkButtons);

		this.listenTo(this.commonButtons, 'buttonClicked', (action, $button) => {
			return this.gridWidget.collection.trigger('backgrid:commonButtonClicked', $button);
		});

		this.listenTo(this.bulkButtons, 'buttonClicked', (action, $button) => {
			return this.gridWidget.collection.trigger('backgrid:bulkButtonClicked', this.getCheckedModels(), $button);
		});
	}

	getBackgridOptions() {
		const i18n = clientRegistry.getI18n();

		return this.gridWidget.prepareBackgridOptions({
			columns: this.getColumnsForBackgrid(),
			collection: this.gridWidget.collection,
			className: 'table table-striped backgrid table-bordered table-hover',
			emptyText: i18n.__('No Data')
		});
	}

	getColumnsForBackgrid() {
		const out = [];

		for (let key = 0; key < this.gridWidget.columns.length; key++) {
			var defaults;
			const val = this.gridWidget.columns[key];
			let cell = null;
			if (val.cell) {
				({
					cell
				} = val);

				if ((Backgrid != null) && val.cell instanceof Backgrid.ButtonsCell) {
					cell = 'buttons';
				}
			}

			switch (cell) {
				case 'buttons':
					defaults = {
						name: 'buttons',
						label: '',
						sortable: false,
						editable: false,
						buttons: [
							{type: 'rm'}
						]
					};
					break;
				default:
					defaults = {
						cell: 'string',
						sortType: 'toggle',
						editable: false,
						clickable: true,
						filter: {
							type: 'text'
						}
					};
			}

			const column = _.defaults(val, defaults);


			if (column.filter) {
				if (!column.filter.attrs) {
					column.filter.attrs = {};
				}

//   			set default bootstrap class for input els, if not specified
				if (!column.filter.attrs.class) {
					column.filter.attrs.class = column.filter.type === 'select' ? 'form-select form-select-sm' : 'form-control form-control-sm';
				}
			}

			out.push(column);
		}

		return out;
	}

	remove() {
		this.backgrid.remove();
		this.backgrid = null;

		this.paginator.remove();
		this.paginator = null;

		this.gridWidget = null;

		this.commonButtons.remove();
		this.commonButtons = null;
		bulkButtonsKit.remove();
		this.bulkButtons = null;

		this.commonFilters.forEach((commonFilter) => commonFilter.remove());
		this.commonFilters = [];

		this.$gridWrapper = null;

		return super.remove();
	}

	setupBulkEvents() {
		this.backgrid.columns.each((column, key) => {
			const cell = column.get('cell');

			if ((this.bulkCheckboxKey == null) && _.isFunction(cell.getType) && (cell.getType() === 'bulkCheckbox')) {
				return this.bulkCheckboxKey = key;
			}
		});

		if (this.bulkCheckboxKey != null) {
			this.listenTo(this.backgrid.columns, 'backgrid:bulkCheckboxChanged', function () {
				return this.checkVisibilityBulkActionBar();
			});

			this.listenTo(this.gridWidget.collection, 'reset', function () {
				this.checkVisibilityBulkActionBar();

				return this.backgrid.columns.at(this.bulkCheckboxKey).trigger('backgrid:collectionReset');
			});
		}
	}

	getCheckedModels(breakOnFirst = false) {
		const out = [];

		if ((this.bulkCheckboxKey != null) && _.isArray(this.backgrid.body.rows)) {
			for (let i = 0; i < this.backgrid.body.rows.length; i++) {
				const row = this.backgrid.body.rows[i];
				if (!_.isUndefined(row.cells) && !_.isUndefined(row.cells[this.bulkCheckboxKey])) {
					const cell = row.cells[this.bulkCheckboxKey];
					if (cell.isChecked()) {
						out.push(row.model);

						if (breakOnFirst) {
							break;
						}
					}
				}
			}
		}

		return out;
	}

	checkVisibilityBulkActionBar() {
		if (this.getCheckedModels(true).length === 0) {
			return this.bulkButtons.hide();
		} else {
			return this.bulkButtons.show();
		}
	}

	changeCheckedState(val) {
		if ((this.bulkCheckboxKey == null)) {
			return;
		}

		const column = this.backgrid.columns.at(this.bulkCheckboxKey);
		return column.trigger('backgrid:bulkCheckboxTrigger', column, val);
	}
}