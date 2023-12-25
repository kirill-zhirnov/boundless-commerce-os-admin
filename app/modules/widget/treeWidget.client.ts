import Widget from './widget.client';
import BackTree from 'backbone-tree-view';
import Filter from '../../packages/system/widgets/filter.client';
import * as bulkButtonsKit from '../bulkButtons/kit.client';
import Backbone from 'backbone';
import _ from 'underscore';
import BulkButtons from '../../packages/system/widgets/bulkButtons.client';

export default class TreeWidget extends Widget {
	public tpl: string | null = null;
	public tplEmpty: string | null = null;
	public isEmptyNow: boolean = false;
	public collectionUrl: string;
	public filter: Filter;
	public bulkButtons: BulkButtons;
	public tree: BackTree.Tree;

	constructor(options) {
		super(options);
	}

	events() {
		return {
			'click .bulk-buttons .remove': this.onBulkRemove,
			'click .select-all': this.onSelectAllClicked
		};
	}

	run() {
		return this.render(this.getTpl());
	}

	isEmpty(): boolean {
		return this.isEmptyNow;
	}

	setEmptiness(isEmpty: boolean) {
		this.isEmptyNow = isEmpty;
	}

	runLazyInit() {
		this.initCollection();
		this.setupTree();

		if (!this.isEmpty()) {
			this.setupNonEmpty();
			this.initialFetch();
		}
	}

	initialFetch() {
		return Promise.resolve()
			.then(() => {
				if (this.filter) {
					return this.filter.fetch();
				} else {
					return this.collection.fetch();
				}
			});
	}

	setupTree() {
		//@ts-ignore
		this.listenToOnce(this.collection, 'sync', () => {
			return Promise.resolve()
				.then(() => {
					if (this.isEmpty()) {
						this.setEmptiness(false);
						return this.reRender();
					}
				})
				.then(() => this.renderBackTree());
		});
	}


	getTpl() {
		if (this.isEmpty() && this.tplEmpty) {
			return this.tplEmpty;
		} else {
			return this.tpl;
		}
	}

	reRender() {
		return this.renderToWrapper(this.getTpl())
			.then(() => {
				if (!this.isEmpty()) {
					this.setupNonEmpty();
				}
			});
	}

	setupNonEmpty() {
		this.setupBulkButtons();
		this.setupFilter();
	}

	renderBackTree() {
		this.tree = new BackTree.Tree(this.prepareBackTreeOptions({
				collection: this.collection
			})
		);

		this.$el.find('.tree-view').append(this.tree.render().$el);
	}

	prepareBackTreeOptions(options) {
		return options;
	}

	initCollection() {
		if (!(this.collection instanceof Backbone.Collection)) {
			const Collection = BackTree.Collection.extend({
				url: this.collectionUrl
			});
			this.collection = new Collection(this.collection);
		}

		//@ts-ignore
		this.listenTo(this.collection, 'userButtonClicked', this.onButtonClicked);
		//@ts-ignore
		this.listenTo(this.collection, 'checkboxChanged', this.onCheckboxChanged);
		this.listenTo$('body', 'refresh.grid', this.refresh);
		//@ts-ignore
		this.listenTo(this.collection, 'dndStructureChanged', this.onDndStructureChanged);
	}

	onButtonClicked() {}

	onCheckboxChanged() {
		if (!this.bulkButtons) {
			return;
		}

		const checked = this.getCheckedModels();

		if (checked.length > 0) {
			return this.bulkButtons.show();
		} else {
			return this.bulkButtons.hide();
		}
	}

	setupFilter() {
		return this.filter = new Filter({
			el: this.$('form.filter').get(0),
			collection: this.collection,
			// $filterToggle: this.$('.filter-toggle')
		});
	}

	setupBulkButtons() {
		this.createBulkButtons();

		if (this.bulkButtons) {
			return this.listenTo(this.bulkButtons, 'buttonClicked', function (action) {
				switch (action) {
					case 'rm':
						return this.onBulkRemove();
					case 'restore':
						return this.onBulkRestore();
					case 'cancel':
						return this.setChecked(false);
				}
			});
		}
	}

	createBulkButtons() {
	}

	refresh() {
		const states = this.collection.getStates();
		this.listenToOnce(this.collection, 'reset', () => {
			if (this.tree) {
				this.tree.settings.set('animation', false);
				this.collection.setStates(states);
				this.tree.settings.set('animation', true);

				return this.resetUIControls();
			}
		});

		return this.collection.fetch({reset: true});
	}

	getFileName() {
		return __filename;
	}

	remove() {
		if (this.tree) {
			this.tree.remove();
			this.tree = null;
		}

		if (this.bulkButtons) {
			bulkButtonsKit.remove();
			this.bulkButtons = null;
		}

		if (this.filter) {
			this.filter.remove();
		}

		return super.remove();
	}

	setChecked(checked) {
		this.setCollectionAttrs({checked});
		this.setSelectAll(checked);

		return this.collection.trigger('checkboxChanged');
	}

	setSelectAll(checked) {
		const $icon = this.$('.select-all .fa');
		const $text = this.$('.select-all .text');

		if (checked) {
			$icon.removeClass('fa-check').addClass('fa-minus');
			return $text.text(this.__('None'));
		} else {
			$icon.removeClass('fa-minus').addClass('fa-check');
			return $text.text(this.__('Select all'));
		}
	}

	setCollectionAttrs(attrs, collection = null) {
		if (!collection) {
			({collection} = this);
		}

		collection.each(model => {
			model.set(attrs);

			if (model.nodes()) {
				this.setCollectionAttrs(attrs, model.nodes());
			}
		});
	}

	resetUIControls() {
		this.setSelectAll(false);
		return this.onCheckboxChanged();
	}

	getCheckedModels() {
		return this.collection.where({checked: true}, {deep: true});
	}

	onSelectAllClicked(e) {
		e.preventDefault();

		this.setChecked(this.$('.select-all .fa').hasClass('fa-check'));
	}

	onBulkRestore() {
		const pk = [];
		_.each(this.getCheckedModels(), function (model) {
			pk.push(model.id);
			return model.collection.remove(model);
		});

		this.proceedBulkRestore(pk);
		this.onCheckboxChanged();
	}

	//eslint-disable-next-line
	proceedBulkRestore(pk) {
	}

	onBulkRemove() {
		if (!confirm(this.getI18n().__('Are you sure?'))) {
			return;
		}

		const pk = [];
		_.each(this.getCheckedModels(), function (model) {
			pk.push(model.id);
			return model.collection.remove(model);
		});

		this.proceedBulkRemove(pk);
		this.onCheckboxChanged();
	}

	//eslint-disable-next-line
	proceedBulkRemove(pk) {
	}

	onDndStructureChanged(model) {
		const data = {
			parent: null,
			sort: []
		};

		data.parent = model.parent() ? model.parent().id : null;

		model.collection.each(model => data.sort.push(model.id));

		this.proceedDndStructureChanged(data);
	}

	//eslint-disable-next-line
	proceedDndStructureChanged(data) {
	}
}
