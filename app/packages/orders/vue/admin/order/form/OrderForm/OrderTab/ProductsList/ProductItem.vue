<template>
	<tr>
		<td class="order-items__col-product">
			<div class="order-items__product">
				<a
					v-if="!isCustomItem"
					class="order-items__img-wrapper"
					:href="url('catalog/admin/product/form', {pk: item.product_id})"
					target="_blank"
				>
					<img
						v-if="item.image && item.image.path"
						:src="makeImgUrl(item.image.path)"
					>
					<div
						v-else
						class="no-image"
					/>
				</a>
				<div>
					<template v-if="!isCustomItem">
						<a
							:href="url('catalog/admin/product/form', {pk: item.product_id})"
							target="_blank"
							class="product-title"
						>
							{{ item.product.title }}
							<i
								class="fa fa-external-link-square"
								aria-hidden="true"
							/>
						</a>
					</template>
					<template v-else>
						<span v-if="orderIsLocked">{{ item.custom_item.title }} </span>
						<template v-else>
							<a
								:href="url('orders/admin/order/items/customItem', {order: order.order_id, pk: item.custom_item.custom_item_id})"
								data-modal=""
								class="product-title"
							>
								{{ item.custom_item.title }}
							</a>
						</template>
					</template>
					<div
						v-if="additionalInfo !== undefined"
						class="mt-1 text-muted"
					>
						{{ additionalInfo }}
					</div>
					<div class="mt-3">
						<span v-if="orderIsLocked">{{ formatMoney(item.final_price) }} </span>
						<template v-else>
							<a
								:href="url('orders/admin/order/items/price', {order: order.order_id, pk: item.item_id})"
								data-modal=""
							>
								{{ formatMoney(item.final_price) }}
							</a>
						</template>
						<s
							v-if="item.basic_price !== item.final_price"
							class="text-muted ml-2"
						>
							{{ formatMoney(item.basic_price) }}
						</s>
					</div>
					<div
						v-if="item.labels.length > 0"
						class="labels mt-3"
					>
						<div
							v-for="(label, index) in item.labels"
							:key="index"
							:style="{
								'background-color': label.color,
								'color': label.text_color
							}"
							class="label m-1 d-inline-block small p-1"
						>
							<span
								v-if="label.icon"
								:class="'fa fa-' + label.icon"
								aria-hidden="true"
							/>
							{{ label.title }}
						</div>
					</div>
				</div>
			</div>
		</td>
		<td class="order-items__col-qty">
			<div class="form-group">
				<input
					v-model="qty"
					:name="`qty[item_${item.item_id}]`"
					type="number"
					class="form-control text-center"
					min="0"
					:readonly="orderIsLocked && 'readonly'"
					@input="formChanged"
				>
			</div>
			<div
				v-if="!isCustomItem"
				class="small mt-2"
			>
				<template v-if="item.track_inventory">
					{{ __('Available: %s', [item.available_qty]) }}
				</template>
				<template v-else>
					<template v-if="item.available_qty > 0">
						{{ __('Available') }}
					</template>
					<template v-else>
						{{ __('Unavailable') }}
					</template>
				</template>
			</div>
		</td>
		<td class="order-items__col-total">
			{{ formatMoney(totalPrice) }}
		</td>
		<td class="order-items__col-rm">
			<a
				v-if="!orderIsLocked"
				href="#"
				@click="remove(item.item_id)"
				class="btn btn-outline-secondary btn-sm"
			>
				<span class="fa fa-trash-o" aria-hidden="true" />
			</a>
			<button v-else
							class="btn btn-outline-secondary btn-sm"
							disabled="disabled"
			>
				<span class="fa fa-trash-o" aria-hidden="true" />
			</button>
		</td>
	</tr>
</template>

<script>
import {mapState, mapActions, mapMutations} from 'vuex';
import {calcTotalPrice} from '../../../../../../../components/priceCalculator.ts';
import {getImgCloudUrl} from '../../../../../../../../../modules/s3Storage/cloudUrl';

export default {
	props: ['item'],
	data() {
		return {
			qty: this.item.qty,
		};
	},
	computed: {
		...mapState([
			'order',
			'orderIsLocked'
		]),
		isCustomItem: function () {
			return this.item.type === 'custom_item';
		},
		totalPrice: function () {
			return calcTotalPrice(this.item.final_price, this.qty);
		},
		hasVariant: function () {
			return this.item.product.has_variants;
		},
		needAvailable: function () {
			return !this.isCustomItem && this.item.track_inventory === true;
		},
		additionalInfo: function () {
			if (this.item.type === 'variant') {
				return this.item.variant.title;
			}

			return undefined;
		},
	},
	watch: {
		qty: {
			handler (val) {
				this.changeItemQty({item_id: this.item.item_id, qty: val});
			}
		},
		item: {
			handler(newItem) {
				this.qty = newItem.qty;
			},
			deep: true,
		}
	},
	methods: {
		...mapActions(['removeOrderItem']),
		...mapMutations(['formChanged', 'changeItemQty']),
		remove(itemId) {
			if (confirm(this.__('Are you sure?'))) {
				this.removeOrderItem({orderId: this.order.order_id, itemsList: [itemId]});
			}
		},
		makeImgUrl(localPath) {
			return getImgCloudUrl(localPath, 80);
		}
	},
};
</script>