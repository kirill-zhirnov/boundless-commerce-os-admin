<template>
	<form
		name="categories"
		@submit.prevent="$emit('submit')"
	>
		<div
			v-if="'is_published' in attrs"
			class="is-published"
		>
			<div class="checkbox form-check">
				<label class="form-check-label">
					<input
						v-model="attrs.is_published"
						class="form-check-input"
						type="checkbox"
						name="is_published"
						value="1"
					>
					{{ __('Product is published') }}
				</label>
			</div>
		</div>
		<label> {{ __('Category') }}</label>
		<div ref="jsTree" />
		<p v-show="!showAddForm">
			<a
				href="#"
				class="small"
				@click.prevent="showAddForm = true"
			>
				<i
					class="fa fa-plus-circle"
					aria-hidden="true"
				/> {{ __('Create category') }}
			</a>
		</p>
		<div
			v-show="showAddForm"
			ref="addForm"
			class="well well-sm add-category"
		>
			<div class="form-group">
				<div class="input-group input-group-sm">
					<input
						ref="categoryTitle"
						v-model="categoryTitle"
						type="text"
						name="category_title"
						class="form-control"
						:placeholder="__('Category title')"
						@keydown.13.prevent="submitSaveForm"
					>
					<button
						class="btn btn-outline-secondary"
						type="button"
						@click.prevent="submitSaveForm"
					>
						<i
							class="fa fa-plus-circle"
							aria-hidden="true"
						/>
						{{ __('Create category') }}
					</button>
				</div>
			</div>
			<div class="text-end">
				<a
					href="#"
					class="small"
					@click.prevent="showAddForm = false"
				>{{ __('Cancel') }}</a>
			</div>
		</div>
		<input
			v-for="categoryId in categories"
			:key="categoryId"
			type="hidden"
			name="category_id[]"
			:value="categoryId"
		>
		<div
			v-show="!showAddForm"
			class="border rounded mb-3 p-2"
		>
			<div class="small text-muted">
				<i
					class="fa fa-info-circle"
					aria-hidden="true"
				/> {{ __('Use right button and Drag&Drop to manage category tree.') }}
			</div>
		</div>
	</form>
</template>
<script>
import $ from 'jquery';

export default {
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs,
			categories: [],
			categoryTitle: '',
			showAddForm: false
		};
	},

	watch: {
		showAddForm() {
			if (this.showAddForm) {
				this.$nextTick(() => {
					this.$refs.categoryTitle.focus();
				});
			}
		}
	},

	mounted() {
		this.jsTree = null;
		this.editUrl = this.url('catalog/admin/category/quickEdit');

		Promise.all([
			this.loadTree(),
			this.$bundle('adminUI')
		])
			.then((res) => {
				let treeRes = res[0];

				this.categories = treeRes.checked;
				this.setupJsTree(treeRes.tree);
			});
	},

	beforeDestroy() {
		$(this.$refs.jsTree).off('.jstree').jstree('destroy');
	},

	methods: {
		setupJsTree(data) {
			$(this.$refs.jsTree)
				.on('changed.jstree', (e, data) => {
					this.categories = [];
					data.instance.get_checked(true).forEach((row) => {
						this.categories.push(row.data.category_id);
					});
				})
				.on('rename_node.jstree', (e, data) => {
					if (!String(data.text).length || data.text == data.old)
						return;

					this.$ajax.post(this.editUrl, {
						pk: data.node.data.category_id,
						category_title: data.text
					}, {hidden: true});
				})
				.on('delete_node.jstree', (e, data) => {
					this.$ajax.post(this.url('catalog/admin/category/rm'), {
						id: [data.node.data.category_id]
					}, {hidden: true});
				})
				.on('move_node.jstree', (e, data) => {
					let post = {
						pk: data.node.data.category_id,
						parent_id: null,
						siblings: []
					};

					let parent = this.jsTree.get_node(data.node.parent);
					if (parent.id != '#')
						post.parent_id = parent.data.category_id;

					parent.children.forEach((categoryId) => {
						let childNode = this.jsTree.get_node(categoryId);
						post.siblings.push(childNode.data.category_id);
					});

					this.$ajax.post(['catalog/admin/category/move'], post, {hidden: true});
				})
				.jstree({
					core: {
						data: data,
						check_callback: true,
						themes: {
							ellipsis: true
						}
					},
					contextmenu: {
						select_node: false,
						items: ($node) => {
							return {
								renameItem: {
									label: this.__('Rename'),
									icon: 'fa fa-pencil',
									action: () => {
										this.jsTree.edit($node);
									}
								},
								deleteItem: {
									label: this.__('Delete'),
									icon: 'fa fa-trash-o',
									action: () => {
										if (confirm(this.__('Are you sure?')))
											this.jsTree.delete_node($node);
									}
								}
							};
						}
					},
					dnd: {
						copy: false,
						inside_pos: 'last',
						drag_selection: false,
						touch: false,
						use_html5: true
					},
					plugins: ['checkbox', 'contextmenu', 'dnd', 'wholerow']
				});

			this.jsTree = $(this.$refs.jsTree).jstree(true);
		},

		loadTree(withChecked = true) {
			let params = {};
			if (withChecked)
				params.product_id = this.form.pk;

			return this.$ajax.get(['catalog/admin/product/category/tree'], params);
		},

		submitSaveForm() {
			let pk;
			this.$form(this.$refs.addForm).submit(this.editUrl)
				.then((res) => {
					pk = res.pk;

					this.categoryTitle = '';
					this.showAddForm = false;

					return this.loadTree(false);
				})
				.then((data) => {
					this.jsTree.settings.core.data = data.tree;
					this.jsTree.refresh();

					setTimeout(() => {
						this.jsTree.select_node(`category-${pk}`);
					}, 100);
				});
		}
	}
};
</script>