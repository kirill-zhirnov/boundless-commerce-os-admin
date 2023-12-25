<template>
	<table class="table table-condensed table-bordered table-striped table-hover products-grid">
		<thead>
			<tr>
				<th>{{ __('Product') }}</th>
				<th>{{ __('Price') }}</th>
				<th />
			</tr>
		</thead>
		<tbody>
			<template v-for="product in products">
				<tr :key="product.product_id">
					<td class="product-col">
						<div class="d-flex align-items-center">
							<i
								v-if="product.has_variants"
								class="fa mr-2"
								aria-hidden="true"
								:class="(open.includes(product.product_id) && variantsByProducts[product.product_id]) ? 'fa-caret-down' : 'fa-caret-right'"
							/>
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
							</div>
						</div>
					</td>
					<td class="price-col">
						<Price
							v-if="product.price_old"
							:price="product.price_old"
							class="text-center old-price text-muted small"
						/>
						<Price
							v-if="product.price"
							:price="product.price"
							class="text-center"
						/>
					</td>
					<td class="qty-col">
						<template v-if="product.has_variants">
							<button
								type="button"
								class="btn btn-outline-secondary btn-sm"
								:disabled="loadingVariants.includes(product.product_id)"
								@click.prevent="toggleVariants(product.product_id)"
							>
								<i
									class="fa mr-2"
									aria-hidden="true"
									:class="(open.includes(product.product_id) && variantsByProducts[product.product_id]) ? 'fa-caret-down' : 'fa-caret-right'"
								/>
								<template v-if="open.includes(product.product_id) && variantsByProducts[product.product_id]">
									{{ __('Hide variants') }}
								</template>
								<template v-else>
									{{ __('Show variants') }}
								</template>
							</button>
						</template>
						<template v-else>
							<template v-if="product.available_qty > 0">
								<div class="available small mb-2">
									{{ product.trackInventory ? __('%s available', [product.available_qty]) : __('In stock') }}
								</div>
<!--								v-if="product.price"-->
								<ToBasketQty
									v-model="qty[`p_${product.product_id}`]"
									:max="product.trackInventory ? product.available_qty : 0"
									@changed="syncQty"
								/>
							</template>
							<div
								v-else
								class="text-muted text-center"
							>
								{{ __('Out of stock') }}
							</div>
						</template>
					</td>
				</tr>
				<tr
					v-if="product.has_variants && open.includes(product.product_id) && variantsByProducts[product.product_id]"
					:key="`${product.product_id}-variants`"
				>
					<td
						colspan="3"
						class="variants-col"
					>
						<table class="table table-condensed table-bordered table-striped table-hover variants-grid">
							<thead>
								<tr>
									<th>{{ __('Variant') }}</th>
									<th>{{ __('Price') }}</th>
									<th />
								</tr>
							</thead>
							<tbody>
								<tr
									v-for="variant in variantsByProducts[product.product_id]"
									:key="variant.variant_id"
								>
									<td class="variant-title">
										{{ variant.title }}
									</td>
									<td class="variant-price">
										<Price
											v-if="variant.price_old"
											:price="variant.price_old"
											class="text-center old-price text-muted small"
										/>
										<Price
											v-if="variant.price"
											:price="variant.price"
											class="text-center"
										/>
									</td>
									<td class="variant-qty">
										<div
											v-if="variant.available_qty > 0"
											class="text-center available small mb-2"
										>
											{{ variant.trackInventory ? __('%s available', [variant.available_qty]) : __('In stock') }}
										</div>
										<div
											v-else
											class="text-center available small mb-2 text-muted"
										>
											{{ __('Out of stock') }}
										</div>
<!--										&& variant.price-->
										<ToBasketQty
											v-if="variant.available_qty > 0"
											v-model="qty[`v_${product.product_id}_${variant.variant_id}`]"
											:max="variant.trackInventory ? variant.available_qty: 0"
											@changed="syncQty"
										/>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</template>
		</tbody>
	</table>
</template>
<script>
import Price from './Products/Price.vue';
import ToBasketQty from './Products/2BasketQty.vue';

export default {

	components: {
		Price,
		ToBasketQty
	},
	props: ['products', 'variants', 'value'],

	data() {
		return {
			open: [],
			loadingVariants: [],
			qty: {}
		};
	},

	computed: {
		variantsByProducts() {
			const out = {};
			this.variants.forEach(({product_id, variants}) => out[product_id] = variants);
			return out;
		}
	},

	watch: {
		variantsByProducts() {
			Object.keys(this.variantsByProducts).forEach((productId) => {
				const index = this.loadingVariants.findIndex((val) => val == productId);
				if (index !== -1) {
					this.loadingVariants.splice(index, 1);
				}
			});
		},

		variants() {
			this.initVariants();
		},

		value(newValue) {
			if (Array.isArray(newValue)) {
				const existsKeys = [];
				for (const product of newValue) {
					if (product.has_variants && Array.isArray(product.variants)) {
						for (const variant of product.variants) {
							existsKeys.push(`v_${product.product_id}_${variant.variant_id}`);
						}
					} else {
						existsKeys.push(`p_${product.product_id}`);
					}
				}

				//need to remove not exists keys from qty
				for (const [key, value] of Object.entries(this.qty)) {
					if (!existsKeys.includes(key) && value > 0) {
						this.qty[key] = 0;
					}
				}
			}
		}
	},

	mounted() {
		this.products.forEach(({product_id}) => {
			let qty = 0;
			if (Array.isArray(this.value)) {
				let product = this.value.find((row) => row.product_id === product_id);
				if (product && !product.has_variants) {
					qty = product.qty;
				}
			}

			this.$set(this.qty, `p_${product_id}`, qty);
		});
		this.initVariants();
	},

	methods: {
		toggleVariants(productId) {
			const index = this.open.findIndex((value) => value == productId);

			if (index === -1) {
				this.open.push(productId);

				if (!(productId in this.variantsByProducts)) {
					this.loadingVariants.push(productId);
					this.$emit('loadVariants', productId);
				}
			} else {
				this.open.splice(index, 1);
			}
		},

		syncQty() {
			let forAdding = Array.from(this.value);
			for (let [key, qty] of Object.entries(this.qty)) {
				const [essence, productId, variantId] = key.split('_');

				const product = this.products.find(({product_id}) => product_id == productId);
				if (!product) {
					continue;
				}

				let productIndexInAdding = forAdding.findIndex(({product_id}) => product_id == productId);
				qty = parseInt(qty);
				if (isNaN(qty)) {
					qty = 0;
				}

				if (productIndexInAdding === -1) {
					let row = {
						product_id: product.product_id,
						title: product.title,
						has_variants: product.has_variants
					};

					if (product.has_variants) {
						row.variants = [];
					} else {
						row.qty = 0;
					}
					forAdding.push(row);
					productIndexInAdding = forAdding.findIndex(({product_id}) => product_id == productId);
				}

				if (essence == 'p') {
					forAdding[productIndexInAdding].qty = qty;
				} else if (essence == 'v' && variantId) {
					const variant = this.variantsByProducts[product.product_id].find(({variant_id}) => variant_id == variantId);
					let variantIndex = forAdding[productIndexInAdding].variants.findIndex(({variant_id}) => variant_id == variant.variant_id);

					if (variantIndex === -1) {
						forAdding[productIndexInAdding].variants.push({
							variant_id: variant.variant_id,
							title: variant.title,
							qty: 0
						});
						variantIndex = forAdding[productIndexInAdding].variants.findIndex(({variant_id}) => variant_id == variant.variant_id);
					}

					forAdding[productIndexInAdding].variants[variantIndex].qty = qty;
				}
			}

			this.$emit('input', forAdding);
		},

		initVariants() {
			if (Array.isArray(this.variants)) {
				this.variants.forEach(({product_id, variants}) => {
					let product = this.value.find((row) => row.product_id === product_id);

					variants.forEach(({variant_id}) => {
						let qty = 0;

						if (product && Array.isArray(product.variants)) {
							const variant = product.variants.find((row) => row.variant_id === variant_id);
							if (variant) {
								qty = variant.qty;
							}
						}

						const key = `v_${product_id}_${variant_id}`;
						if (!(key in this.qty)) {
							this.$set(this.qty, key, qty);
						}
					});
				});
			}
		}
	}
};
</script>