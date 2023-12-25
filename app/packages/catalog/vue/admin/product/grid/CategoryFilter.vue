<template>
	<div class="bg-light rounded p-2">
		<h5>{{ __('Categories') }}</h5>
		<div
			ref="jsTree"
			class="jstree-with-ellipsis"
		/>
	</div>
</template>
<script>

import $ from 'jquery';

export default {
	props: ['collection'],
	data() {
		return {
			categories: null
		};
	},
	async mounted() {
		await this.$bundle('adminUI');
		const {tree} = await this.$ajax.get(['catalog/admin/product/category/gridFilters']);

		this.syncCollection = (() => {
			let categoryId = 0;
			if (this.collection.queryParams.category_id) {
				categoryId = parseInt(this.collection.queryParams.category_id) || 0;
			}

			$(this.$refs.jsTree).jstree('deselect_all');
			$(this.$refs.jsTree).jstree('select_node', `category-${categoryId}`);
		}).bind(this);

		$(this.$refs.jsTree)
			.on('ready.jstree', () => this.syncCollection())
			.on('select_node.jstree', (e, data) => {
				if (data && data.event) {
					const node = $(this.$refs.jsTree).jstree('get_node', data.node.id);
					if (node) {
						this.collection.trigger('updated.extFilter', {category_id: node.data.category_id});
					}
				}
			})
			.jstree({
				core: {
					data: tree,
					themes: {
						ellipsis: true
					}
				},
				plugins: ['wholerow']
			});

		this.jsTree = $(this.$refs.jsTree).jstree(true);
		this.collection.on('sync', this.syncCollection);
	},

	beforeDestroy() {
		$(this.$refs.jsTree).off('.jstree').jstree('destroy');
		this.collection.off('sync', this.syncCollection);
	},
};
</script>