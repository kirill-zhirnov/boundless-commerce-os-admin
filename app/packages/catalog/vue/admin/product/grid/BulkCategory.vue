<template>
	<div>
		<input
			v-for="productId in pk"
			:key="productId"
			type="hidden"
			name="pk[]"
			:value="productId"
		>

		<div class="form-group">
			<label> {{ __('Choose category:') }}</label>
			<input
				type="hidden"
				name="category"
			>
			<input
				v-model="action"
				type="hidden"
				name="action"
			>
			<input
				v-for="categoryId in categories"
				:key="categoryId"
				type="hidden"
				name="category[]"
				:value="categoryId"
			>
			<div ref="jsTree" />
		</div>
		<div class="text-center">
			<button
				class="btn btn-outline-secondary m-1"
				@click.prevent="action='moveTo';submit()"
			>
				<i
					class="fa fa-arrow-circle-o-right"
					aria-hidden="true"
				/>
				{{ __('Move to categories') }}
			</button>
			<button
				class="btn btn-outline-secondary m-1"
				@click.prevent="action='addTo';submit()"
			>
				<i
					class="fa fa-plus-circle"
					aria-hidden="true"
				/>
				{{ __('Add to categories') }}
			</button>
			<button
				class="btn btn-outline-secondary m-1"
				@click.prevent="action='del';submit()"
			>
				<i
					class="fa fa-minus-circle"
					aria-hidden="true"
				/>
				{{ __('Delete from categories') }}
			</button>
		</div>
	</div>
</template>
<script>
import $ from 'jquery';

export default {
	props: ['pk'],
	data() {
		return {
			action: null,
			categories: [],
		};
	},

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
		submit() {
			this.$nextTick(() => {
				this.$form(this.$el).submit(['catalog/admin/product/bulk/category']);
			});
		},

		setupJsTree(data) {
			$(this.$refs.jsTree)
				.on('changed.jstree', (e, data) => {
					this.categories = [];
					data.instance.get_checked(true).forEach((row) => {
						this.categories.push(row.data.category_id);
					});
				})
				.jstree({
					core: {
						data: data,
						themes: {
							ellipsis: true
						}
					},
					plugins: ['checkbox', 'wholerow']
				});

			this.jsTree = $(this.$refs.jsTree).jstree(true);
		}
	}
};
</script>