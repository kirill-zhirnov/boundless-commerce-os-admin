<template>
	<div class="products-elector">
		<div class="row">
			<div class="col-sm-5">
				<div ref="jsTree" />
			</div>
			<div class="col-sm-7">
				<form
					class="filter"
					@submit.prevent="loadProducts()"
				>
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
				</form>
				<table class="table table-condensed table-bordered table-striped table-hover">
					<thead>
						<tr>
							<th class="col-checkbox">
								<label>
									<input
										v-model="selectAll"
										name="variant_all"
										type="checkbox"
										value="1"
									>
								</label>
							</th>
							<th>{{ __('Product') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="product in products"
							:key="product.product_id"
						>
							<td class="col-checkbox">
								<label>
									<input
										v-model="selected"
										type="checkbox"
										:value="product.product_id"
									>
								</label>
							</td>
							<td
								class="col-product"
								@click="select(product.product_id)"
							>
								<div class="product">
									<img
										v-if="product.thumb"
										:src="product.thumb.s.src"
									>
									<div>
										<div>{{ product.title }}</div>
										<div
											v-if="product.sku"
											class="text-muted small"
										>
											{{ __('SKU:') }} {{ product.sku }}
										</div>
										<div class="text-muted small">
											<template v-if="Array.isArray(product.price)">
												{{ __('From: %s', [formatMoney(product.price)]) }}
											</template>
											<template v-else>
												{{ formatMoney(product.price) }}
											</template>
										</div>
									</div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
				<widget
					v-if="products.length"
					path="system.pagination.@c"
					:params="{
						collection:[$clear(paging), $clear(products)],
						data: {
							basicUrl: 'test'
						}
					}"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';
import _ from 'underscore';

export default {
	props: {},

	data() {
		return {
			filter: {
				category: -1,
				query: ''
			},
			products: [],
			paging: {
				totalEntries: null,
				perPage: 10,
				page: 1
			},
			selectAll: false,
			selected: [],
			selectedProducts: []
		};
	},

	watch: {
		'filter.query': function() {
			this._loadProducts();
		},

		'filter.category': function() {
			this.loadProducts();
		},

		selectAll(val) {
			if (val) {
				this.products.forEach((row) => {
					let id = row.product_id;
					if (!this.selected.includes(id))
						this.selected.push(id);
				});
			} else {
				this.selected.splice(0, this.selected.length);
			}
		},

		selected(val) {
			val.forEach((productId) => {
				if (!_.findWhere(this.selectedProducts, {product_id: productId})) {
					this.selectedProducts.push(_.findWhere(this.products, {product_id: productId}));
				}
			});

			this.selectedProducts = this.selectedProducts.filter((row) => {
				return val.includes(row.product_id);
			});

			this.$emit('selected', val);
		}
	},

	mounted() {
		this._loadProducts = _.throttle(() => this.loadProducts(), 300);

		Promise.all([
			this.$ajax.get(['catalog/admin/product/category/tree']),
			this.$bundle('adminUI')
		])
			.then((res) => this.setupJsTree(res[0].tree));

		this.loadProducts();

		$(this.$el).on('click', '.pagination a[data-page]', (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.paging.page = $(e.currentTarget).data('page');
			this.loadProducts();
		});
	},

	beforeDestroy() {
		$(this.$refs.jsTree).off('.jstree').jstree('destroy');
		$(this.$el).off('click');
	},

	methods: {
		loadProducts() {
			let params = {
				product: this.filter.query,
				perPage: this.paging.perPage,
				page: this.paging.page,
			};

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
					this.filter.category = (selected[0]) ? selected[0].data.category_id : -1;
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

		select(productId) {
			let pos = this.selected.indexOf(productId);
			if (pos == -1) {
				this.selected.push(productId);
			} else {
				this.selected.splice(pos, 1);
			}
		},

		rmSelected(productId) {
			let pos = this.selected.indexOf(productId);
			if (pos != -1)
				this.selected.splice(pos, 1);
		},

		getSelectedProducts() {
			return this.selectedProducts;
		}
	}
};
</script>