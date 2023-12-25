<template>
	<div ref="jsTree" />
</template>
<script>
import $ from 'jquery';

export default {
	mounted() {
		Promise.all([
			this.$ajax.get(['catalog/admin/product/category/tree']),
			this.$bundle('adminUI')
		])
			.then((res) => this.setupJsTree(res[0].tree));
	},

	beforeDestroy() {
		$(this.$refs.jsTree).off('.jstree').jstree('destroy');
	},
	methods: {
		setupJsTree(data) {
			data.splice(0, 0, {
				id: -1,
				state: {
					selected: true
				},
				text: this.__('All products'),
				data: {
					category_id: -1
				}
			});

			$(this.$refs.jsTree)
				.on('changed.jstree', (e, data) => {
					let selected = data.instance.get_selected(true);

					const category = (selected[0]) ? selected[0].data.category_id : -1;
					this.$emit('category-selected', {category});
				})
				.jstree({
					core: {
						data: data,
						themes: {
							ellipsis: true
						}
					},
					plugins: ['wholerow']
				});

			this.jsTree = $(this.$refs.jsTree).jstree(true);
		},
	}
};
</script>