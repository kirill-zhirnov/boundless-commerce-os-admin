// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Widget = pathAlias('@widget');
const BackTree = require('backbone-tree-view');
const Filter = pathAlias('@p-system/widgets/filter.@c');
const bulkButtonsKit = pathAlias('@modules/bulkButtons/kit.@c');
const Backbone = pathAlias('@bb');

class TreeWidget extends Widget {
	initialize() {
		this.tree = null;
		this.bulkButtons = null;
		this.collectionUrl = null;

		this.tpl = null;
		this.tplEmpty = null;

		this.filter = null;
		return this.isEmptyNow = false;
	}

	events() {
		return {
			'click .bulk-buttons .remove' : this.onBulkRemove,
			'click .select-all' : this.onSelectAllClicked
		};
	}

	run() {
		let tpl;
		if (this.isEmpty() && this.tplEmpty) {
			tpl = this.tplEmpty;
		} else {
			({
                tpl
            } = this);
		}

		return this.render(tpl);
	}

	isEmpty() {
		return this.isEmptyNow;
	}

	setEmptiness(isEmpty) {
		this.isEmptyNow = isEmpty;
	}

	runLazyInit() {
		this.initCollection();
		this.setupTree();

		if (!this.isEmpty()) {
			this.setupNonEmpty();

			return this.initialFetch();
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
		return this.listenToOnce(this.collection, 'sync', () => {
			return Promise.resolve()
			.then(() => {
				if (this.isEmpty()) {
					this.setEmptiness(false);
					return this.reRender();
				}
		}).then(() => {
				this.renderBackTree();

			});
		});
	}


	getTpl() {
		if (this.isEmpty() && this.tplEmpty) { return this.tplEmpty; } else { return this.tpl; }
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
		return this.setupFilter();
	}

	renderBackTree() {
		this.tree = new BackTree.Tree(this.prepareBackTreeOptions({
			collection : this.collection
		})
		);

		return this.$el.find('.tree-view').append(this.tree.render().$el);
	}

	prepareBackTreeOptions(options) {
		return options;
	}

	initCollection() {
		if (!(this.collection instanceof Backbone.Collection)) {
			const Collection = BackTree.Collection.extend({
				url : this.collectionUrl
			});
			this.collection = new Collection(this.collection);
		}

		this.listenTo(this.collection, 'userButtonClicked', this.onButtonClicked);
		this.listenTo(this.collection, 'checkboxChanged', this.onCheckboxChanged);
		this.listenTo$('body', 'refresh.grid', this.refresh);

		return this.listenTo(this.collection, 'dndStructureChanged', this.onDndStructureChanged);
	}

	onButtonClicked(e, view) {}

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
			el : this.$('form.filter').get(0),
			collection : this.collection,
			$filterToggle : this.$('.filter-toggle')
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
					case 'cancel':
						return this.setChecked(false);
				}
			});
		}
	}

	createBulkButtons() {}

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

		return super.remove(...arguments);
	}

	setChecked(checked) {
		this.setCollectionAttrs({checked});
		this.setSelectAll(checked);

		return this.collection.trigger('checkboxChanged');
	}

	setSelectAll(checked) {
		const $icon = this.$('.select-all .glyphicon');
		const $text = this.$('.select-all .text');

		if (checked) {
			$icon.removeClass('glyphicon-ok').addClass('glyphicon-minus');
			return $text.text(this.__('None'));
		} else {
			$icon.removeClass('glyphicon-minus').addClass('glyphicon-ok');
			return $text.text(this.__('Select all'));
		}
	}

	setCollectionAttrs(attrs, collection = null) {
		if (!collection) {
			({
                collection
            } = this);
		}

		return collection.each(model => {
			model.set(attrs);

			if (model.nodes()) {
				return this.setCollectionAttrs(attrs, model.nodes());
			}
		});
	}

	resetUIControls() {
		this.setSelectAll(false);
		return this.onCheckboxChanged();
	}

	getCheckedModels() {
		return this.collection.where({checked:true}, {deep:true});
	}

	onSelectAllClicked(e) {
		e.preventDefault();

		return this.setChecked(this.$('.select-all .glyphicon').hasClass('glyphicon-ok'));
	}

	onBulkRestore() {
		const pk = [];
		_.each(this.getCheckedModels(), function(model) {
			pk.push(model.id);
			return model.collection.remove(model);
		});

		this.proceedBulkRestore(pk);
		return this.onCheckboxChanged();
	}

	proceedBulkRestore(pk) {}

	onBulkRemove() {
		if (!confirm(this.getI18n().__('Are you sure?'))) {
			return;
		}

		const pk = [];
		_.each(this.getCheckedModels(), function(model) {
			pk.push(model.id);
			return model.collection.remove(model);
		});

		this.proceedBulkRemove(pk);
		return this.onCheckboxChanged();
	}

	proceedBulkRemove(pk) {}

	onDndStructureChanged(model) {
		const data = {
			parent : null,
			sort : []
		};

		data.parent = model.parent() ? model.parent().id : null;

		model.collection.each(model => data.sort.push(model.id));

		return this.proceedDndStructureChanged(data);
	}

	proceedDndStructureChanged(data) {}
}

module.exports = TreeWidget;