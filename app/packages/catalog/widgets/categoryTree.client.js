import TreeWidget from '../../../modules/widget/treeWidget.client';
import _ from 'underscore';
import ajax from '../../../modules/ajax/kit.client';
import * as bulkButtonsKit from '../../../modules/bulkButtons/kit.client';
import $ from 'jquery';

const bulkBtnClasses = 'btn btn-purple btn-sm';
const faPrefix = 'fa fa-';

export default class CategoryTree extends TreeWidget {
	constructor(options) {
		super(options);

		this.collectionUrl = this.url('catalog/admin/category/treeCollection');
	}

	attributes() {
		return {
			class: 'category-tree'
		};
	}

	run() {
		return this.render('categoryTree');
	}

	events() {
		return _.extend(super.events(), {
			'click .bt-item .right-part a[data-mode="edit"]'(e) {
				const $el = $(e.currentTarget);

				const state = this.filter.getFormParams();
				state.opened = this.collection.where({open: true}, {deep: true}).map(model => {
					return model.get('id');
				});

				const url = this.url('catalog/admin/category/form/edit', {
					pk: $el.data('id'),
					grid: state
				});

				return $el.attr('href', url);
			},

			'input input[name="rmStatus"]'(e) {
				const $clearRm = this.$('.clear-rm');

				if ($(e.currentTarget).is(':checked')) {
					return $clearRm.show();
				} else {
					return $clearRm.hide();
				}
			},

			'click a.clear-rm'(e) {
				e.preventDefault();

				if (!confirm(this.__('Are you sure?'))) {
					return;
				}

				return ajax.post($(e.target).attr('href')).then(() => {
					this.$('input[name="rmStatus"]').prop('checked', false);
					this.$('.clear-rm').hide();

					return this.refresh();
				});
			}
		});
	}

	setupTree() {
		super.setupTree();

		this.listenToOnce(this.collection, 'sync', () => {
			setTimeout(() => {
				if ('filter' in this.data) {
					const {opened} = this.data.filter.attrs;
					if (Array.isArray(opened)) {
						opened.forEach(id => {
							const models = this.collection.where({id: parseInt(id)}, {deep: true});
							if (models.length) {
								models[0].set('open', true);
							}
						});
					}
				}
			}
			, 50);
		});
	}

	setupBulkButtons() {
		this.createBulkButtons();

		if (this.bulkButtons) {
			return this.listenTo(this.bulkButtons, 'buttonClicked', function(action, $button) {
				switch (action) {
					case 'rm':
						return this.onBulkRemove();
					case 'restore':
						return this.onBulkRestore();
					case 'showInMenu':
						return this.onBulkShowInMenu();
					case 'hideFromMenu':
						return this.onBulkHideFromMenu();
					case 'publish':
						return this.onBulkActionPublish($button);
					case 'cancel':
						return this.setChecked(false);
				}
			});
		}
	}

	createBulkButtons() {
		//@ts-ignore
		this.bulkButtons = bulkButtonsKit.create({
			buttons: {
				normal : [
					{
						label: this.__('Archive'),
						icon: `${faPrefix}trash-o`,
						class: bulkBtnClasses,
						attrs: {
							'data-action': 'rm'
						}
					},
					[
						{
							icon : `${faPrefix}eye`,
							class : bulkBtnClasses,
							attrs : {
								'data-action': 'publish',
								'data-publish': '1',
								title: this.__('Publish selected')
							}
						},
						{
							icon : `${faPrefix}eye-slash`,
							class : bulkBtnClasses,
							attrs : {
								'data-action': 'publish',
								'data-publish': '0',
								title: this.__('Hide selected from the site')
							}
						},
					],
					{
						label: this.__('Show in menu'),
						class: bulkBtnClasses,
						attrs: {
							'data-action': 'showInMenu'
						}
					},
					{
						label: this.__('Hide from menu'),
						class: bulkBtnClasses,
						attrs: {
							'data-action': 'hideFromMenu'
						}
					}
				],
				removed : [
					{type: 'restore'}
				]
			},

			scope : () => {
				const models = this.getCheckedModels();
				if (models[0] && (models[0].get('deleted_at') != null)) {
					return 'removed';
				}

				return 'normal';
			}
		});
	}

	prepareBackTreeOptions(options) {
		const Item = require('./categoryTree/itemView.client').default;

		return _.extend(options, {
			settings : {
				ItemConstructor : Item,
				checkbox : true,
				plugins : {
					DnD : {
						changeParent : false
					}
				}
			}
		});
	}

	proceedDndStructureChanged(data) {
		return ajax.post(['catalog/admin/category/saveSort'], data);
	}

	proceedBulkRestore(pk) {
		return ajax.get(['catalog/admin/category/restore'], {id:pk});
	}

	proceedBulkRemove(pk) {
		return ajax.get(['catalog/admin/category/rm'], {id:pk});
	}

	getSelectedItems() {
		const pk = [];
		_.each(this.getCheckedModels(), model => pk.push(model.id));

		return pk;
	}

	onBulkShowInMenu(data) {
		const pk = this.getSelectedItems();
		return ajax.get(['catalog/admin/category/menuShow'], {id:pk})
		.then(() => {
			this.setChecked(false);
			return this.refresh();
		});
	}


	onBulkHideFromMenu(data) {
		const pk = this.getSelectedItems();
		return ajax.get(['catalog/admin/category/menuHide'], {id:pk})
		.then(() => {
			this.setChecked(false);
			return this.refresh();
		});
	}

	onBulkActionPublish($btn) {
		return ajax.post(['catalog/admin/category/publishStatus'], {
			pk: this.getSelectedItems(),
			publish: $btn.data('publish')
		})
		.then(() => {
			this.setChecked(false);
			return this.refresh();
		});
	}

	getFileName() {
		return __filename;
	}
}