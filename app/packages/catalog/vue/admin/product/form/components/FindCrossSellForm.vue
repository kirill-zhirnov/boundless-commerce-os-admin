<template>
	<div class="cross-sell">
		<!-- <p
			v-if="help"
			class="text-end help"
		>
			<a
				:href="help.url"
				target="_blank"
				class="small text-muted"
			>
				<i class="fa fa-question-circle" /> {{ help.title }} <i class="fa fa-external-link" />
			</a>
		</p> -->
		<div class="row">
			<div class="col-sm-9">
				<ProductsElector
					ref="elector"
					@selected="upSelected"
				/>
			</div>
			<div class="col-sm-3 col-selected">
				<input
					type="hidden"
					name="category"
					:value="category.alias"
				>
				<input
					v-for="product in products"
					:key="product.product_id"
					type="hidden"
					name="product[]"
					:value="product.product_id"
				>

				<div class="page-header">
					<h4> {{ __('Selected products:') }} </h4>
				</div>
				<template v-if="selected.length">
					<ul>
						<li
							v-for="product in selected"
							:key="product.product_id"
						>
							<input
								type="hidden"
								name="rel_product[]"
								:value="product.product_id"
							>

							{{ product.title }}
							<a
								href="#"
								class="text-muted small"
								@click.prevent="rmSelected(product.product_id)"
							>
								<i class="fa fa-times" />
							</a>
						</li>
					</ul>
					<hr>
					<div class="checkbox form-check">
						<label class="form-check-label">
							<input
								class="form-check-input"
								type="checkbox"
								name="add_cross_relations"
								value="1"
							>
							{{ __('Add relations between all selected products') }}
						</label>
					</div>
					<div class="text-center">
						<button
							type="submit"
							class="btn btn-primary btn-sm"
							@click.prevent="save()"
						>
							{{ __('Add') }}
						</button>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>
<script>
import ProductsElector from '../../ProductsElector.vue';

export default {

	components: {
		ProductsElector
	},
	props: ['products', 'category', 'help'],

	data() {
		return {
			selected: []
		};
	},

	methods: {
		upSelected() {
			this.selected = this.$refs.elector.getSelectedProducts();
		},

		rmSelected(productId) {
			this.$refs.elector.rmSelected(productId);
		},

		save() {
			this.$form(this.$el).submit(['catalog/admin/product/crossSell/add']);
		}
	}
};
</script>
<style scoped>
	.help {
		margin-bottom: 20px;
	}
</style>