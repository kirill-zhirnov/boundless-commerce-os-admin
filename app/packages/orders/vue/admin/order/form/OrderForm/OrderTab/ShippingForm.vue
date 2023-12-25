<template>
	<section class="order-section">
		<h4>{{ __("Shipping") }}</h4>
		<div v-if="!shipping">
			<a
				v-if="!orderIsLocked"
				:href="url('orders/admin/order/shipping/edit', {order: order.order_id})"
				data-modal=""
				class="btn btn-outline-secondary btn-sm"
			>
				<i class="fa fa-plus" aria-hidden="true" /> {{ __('Add shipping') }}
			</a>
			<span v-if="orderIsLocked">{{ __('No shipping') }} </span>
		</div>
		<div v-if="shipping"
				 class="order-section__row"
		>
			<div class="order-section__title">
				<div>
					<a
						v-if="!orderIsLocked"
						:href="url('orders/admin/order/shipping/edit', {order: order.order_id})"
						data-modal=""
					>
						{{ shipping.title }}
					</a>
					<span v-if="orderIsLocked">{{ shipping.title }}</span>
				</div>
				<div class="mt-2 text-muted">
					<em>{{ shipping.text_info }}</em>
				</div>
			</div>
			<div class="order-section__total">
				{{ formatMoney(shipping.price || 0) }}
			</div>
			<div class="order-section__rm">
				<a
					v-if="!orderIsLocked"
					href="#"
					@click.prevent="rm"
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
	</section>
</template>
<script>
import {mapState, mapActions} from 'vuex';

export default {
	computed: {
		...mapState(['order', 'orderIsLocked', 'shipping'])
	},
	mounted() {
		this.getShippingInfo({orderId: this.order.order_id});
	},
	methods: {
		...mapActions(['getShippingInfo', 'rmShipping']),
		rm() {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.rmShipping({orderId: this.order.order_id});
		}
	}
};
</script>