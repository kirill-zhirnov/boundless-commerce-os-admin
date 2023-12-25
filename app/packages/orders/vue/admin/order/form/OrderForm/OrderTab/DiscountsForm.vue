<template>
	<section class="order-section">
		<h4>{{ __("Discounts") }}</h4>
		<div v-if="!discounts || !discounts.length">
			<a
				v-if="!orderIsLocked"
				:href="url('orders/admin/order/discount/form', {order: order.order_id})"
				data-modal=""
				class="btn btn-outline-secondary btn-sm"
			>
				<i
					class="fa fa-plus"
					aria-hidden="true"
				/> {{ __('Add discount') }}
			</a>
			<span v-if="orderIsLocked">{{ __('No discounts') }} </span>
		</div>
		<div v-else>
			<div
				v-for="(discount) in discounts"
				:key="discount.discount_id"
				class="order-section__row"
			>
				<div class="order-section__title">
					<div>
						<a
							v-if="!orderIsLocked"
							:href="url('orders/admin/order/discount/form', {order: order.order_id, pk: discount.discount_id})"
							data-modal=""
						>
							{{ discount.source === 'manual' ? __('Discount for the order'): discount.title }} - <strong>{{ discount.value || '0.00' }} {{ discount.discount_type === 'percent' ? '%' : getLocale().getCurrencySymbol() }}</strong>
						</a>
						<span v-if="orderIsLocked">{{ discount.source === 'manual' ? __('Discount for the order'): discount.title }} - <strong>{{ discount.value || '0.00' }} {{ discount.discount_type === 'percent' ? '%' : getLocale().getCurrencySymbol() }}</strong></span>
					</div>
					<div
						v-if="discount.source === 'manual'"
						class="text-muted mt-1"
					>
						<em>{{ discount.title }}</em>
					</div>
				</div>
				<div class="order-section__total">
					<template v-if="totalCalculated">
						{{ formatMoney(-totalCalculated.discount) }}
					</template>

				</div>
				<div class="order-section__rm">
					<a
						v-if="!orderIsLocked"
						href="#"
						@click.prevent="rm(discount.discount_id)"
						class="btn btn-outline-secondary btn-sm"
					>
						<i class="fa fa-trash-o" aria-hidden="true"></i>
					</a>
					<button v-else
									disabled="disabled"
									class="btn btn-outline-secondary btn-sm"
					>
						<i class="fa fa-trash-o" aria-hidden="true"></i>
					</button>
				</div>
			</div>
		</div>
	</section>
</template>
<script>
import {mapState, mapActions} from 'vuex';

export default {
	computed: {
		...mapState(['order', 'orderList', 'orderIsLocked', 'discounts', 'totalCalculated'])
	},
	mounted() {
		this.getDiscounts({orderId: this.order.order_id});
	},
	methods: {
		...mapActions(['getDiscounts', 'rmDiscount']),
		rm(id) {
			if (!confirm(this.__('Are you sure?'))) return;

			this.rmDiscount({id, orderId: this.order.order_id});
		},
	}
};
</script>