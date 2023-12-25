<template>
	<div class="order-add-products">
		<div class="row">
			<div class="col-sm-4 col-md-4">
				<Categories @category-selected="categorySelected" />
			</div>
			<div class="col-sm-8 col-md-8">
				<div class="form-group text-end">
					<button
						type="button"
						:disabled="forAddingQty === 0 || isSaving"
						class="btn"
						:class="(forAddingQty > 0) ? 'btn-primary' : 'btn-default'"
						@click.prevent="onSubmitClicked"
					>
						{{ __('Add %s item(s)', [forAddingQty]) }}
					</button>
				</div>
				<form
					class="filter"
					@submit.prevent="loadProducts()"
				>
					<div class="form-group">
						<div class="input-group input-group-sm">
							<input
								v-model="filter.query"
								type="text"
								class="form-control"
								:placeholder="__('Search')"
							>
							<span class="input-group-text">
								<!-- <button
									class="btn btn-default"
									type="button"
								> -->
								<i class="fa fa-search" />
								<!-- </button> -->
							</span>
						</div>
					</div>
					<div class="row">
						<div class="col-sm-4">
							<div class="form-group">
								<select
									v-model="filter.label_id"
									class="form-select form-select-sm"
								>
									<option
										v-for="option in options.label"
										:key="option[0]"
										:value="option[0]"
									>
										{{ option[1] }}
									</option>
								</select>
							</div>
						</div>
						<div class="col-sm-4">
							<div class="form-group">
								<select
									v-model="filter.collection_id"
									class="form-select form-select-sm"
								>
									<option
										v-for="option in options.collection"
										:key="option[0]"
										:value="option[0]"
									>
										{{ option[1] }}
									</option>
								</select>
							</div>
						</div>
						<div class="col-sm-4">
							<div class="form-group">
								<select
									v-model="filter.stock"
									class="form-select form-select-sm"
								>
									<option
										v-for="option in options.stock"
										:key="option[0]"
										:value="option[0]"
									>
										{{ option[1] }}
									</option>
								</select>
							</div>
						</div>
					</div>
				</form>
				<Products
					v-if="products.length"
					v-model="forAdding"
					:products="products"
					:variants="variants"
					@loadVariants="loadVariants"
				/>
				<widget
					v-if="products.length"
					path="system.pagination.@c"
					:params="{collection:[$clear(paging), $clear(products)],data: {basicUrl: 'test'}}"
				/>
			</div>
		</div>
		<div v-if="forAddingQty > 0">
			<h4>{{ __('Add items:') }}</h4>
			<SummaryAdding
				:for-adding-only-with-qty="forAddingOnlyWithQty"
				@rmItem="rmAddingItem"
			/>
		</div>
		<div class="text-end">
			<button
				type="button"
				:disabled="forAddingQty === 0 || isSaving"
				class="btn"
				:class="(forAddingQty > 0) ? 'btn-primary' : 'btn-default'"
				@click.prevent="onSubmitClicked"
			>
				{{ __('Add %s item(s)', [forAddingQty]) }}
			</button>
		</div>
	</div>
</template>
<script>
import Categories from './AddProductsForm/Categories.vue';
import Products from './AddProductsForm/Products.vue';
import SummaryAdding from './AddProductsForm/SummaryAdding.vue';
import $ from 'jquery';
import _ from 'underscore';
import {mapMutations} from 'vuex';

export default {

	components: {
		Categories,
		Products,
		SummaryAdding
	},
	props: ['options', 'pk'],
	data() {
		return {
			products: [],
			variants: [],
			filter: {
				category: -1,
				query: '',
				label_id: '',
				collection_id: '',
				stock: ''
			},
			paging: {
				totalEntries: null,
				perPage: 10,
				page: 1
			},
			forAdding: [],
			isSaving: false
		};
	},

	computed: {
		forAddingOnlyWithQty() {
			const out = this.forAdding.filter(({has_variants, qty, variants}) => {
				if (has_variants) {
					let totalVariants = variants.reduce((accumulator, {qty}) => accumulator + qty, 0);
					return totalVariants > 0;
				} else {
					return qty > 0;
				}
			});

			out.forEach(({has_variants, variants}, index) => {
				if (has_variants && Array.isArray(variants)) {
					out[index].variants = variants.filter(({qty}) => qty > 0);
				}
			});

			return out;
		},
		forAddingQty() {
			let out = 0;

			this.forAdding.forEach(({has_variants, qty, variants}) => {
				if (has_variants) {
					out += variants.reduce((accumulator, {qty}) => accumulator + qty, 0);
				} else {
					out += qty;
				}
			});

			return out;
		}
	},

	watch: {
		'filter.query': function() {
			this._loadProducts();
		},
		'filter.category': function() {
			this.loadProducts();
		},
		'filter.label_id': function() {
			this.loadProducts();
		},
		'filter.collection_id': function() {
			this.loadProducts();
		},
		'filter.stock': function() {
			this.loadProducts();
		},
	},
	mounted() {
		this._loadProducts = _.throttle(() => this.loadProducts(), 300);

		this.loadProducts();

		$(this.$el).on('click', '.pagination a[data-page]', (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.paging.page = $(e.currentTarget).data('page');
			this.loadProducts();
		});
	},
	beforeDestroy() {
		$(this.$el).off('click');
	},
	methods: {
		...mapMutations(['addOrReplaceItem']),
		categorySelected({category}) {
			this.filter.category = category;
		},

		loadProducts() {
			const params = {
				perPage: this.paging.perPage,
				page: this.paging.page,

				//filters:
				product: this.filter.query,
				stock: this.filter.stock,
			};

			['label_id', 'collection_id'].forEach((key) => {
				if (this.filter[key] != '') {
					params[key] = this.filter[key];
				}
			});

			if (this.filter.category != -1) {
				params.category_id = this.filter.category;
			}

			this.$ajax.get(['catalog/admin/product/collection'], params)
				.then((res) => {
					this.paging = res[0];

					this.products = [];
					this.$nextTick(() => this.products = res[1]);
				});
		},

		loadVariants(productId) {
			const index = this.variants.findIndex(({product_id}) => product_id == productId);
			if (index !== -1) {
				return;
			}

			this.$ajax.get(['catalog/admin/product/variant/list'], {product: productId})
				.then(({variants}) => {
					const index = this.variants.findIndex(({product_id}) => product_id == productId);
					if (index === -1) {
						this.variants.push({product_id: productId, variants});
					}
				});
		},

		rmAddingItem(item) {
			const productIndex = this.forAdding.findIndex(({product_id}) => product_id == item.product_id);
			if (productIndex === -1) {
				return;
			}

			if (item.type == 'variant') {
				const product = this.forAdding[productIndex];

				const variantIndex = product.variants.findIndex(({variant_id}) => variant_id == item.variant_id);
				product.variants.splice(variantIndex, 1);
				this.forAdding.splice(productIndex, 1, product);
			} else {
				this.forAdding.splice(productIndex, 1);
			}
		},

		onSubmitClicked() {
			this.isSaving = true;
			this.$ajax.post(['orders/admin/order/items/add', {pk: this.pk}], {items: this.forAddingOnlyWithQty})
				.then(({addedItems}) => {
					this.isSaving = false;
					for (const item of addedItems) {
						this.addOrReplaceItem(item);
					}
					$(this.$el).trigger('close.modal');
				})
			;
		}
	}
};
</script>