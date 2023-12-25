<template>
	<section class="order-section">
		<h4>{{ __('Payment method') }}</h4>
		<div v-if="!order.paymentMethod">
			<a
				v-if="!orderIsLocked"
				:href="url('orders/admin/order/paymentMethod/form', {pk: order.order_id})"
				data-modal=""
				class="btn btn-outline-secondary btn-sm"
			>
				<i
					class="fa fa-credit-card-alt me-2"
					aria-hidden="true"
				/>{{ __('Specify payment method') }}
			</a>
			<span v-if="orderIsLocked">{{ __('The payment method is not specified') }} </span>
		</div>
		<div v-if="order.paymentMethod"
				 class="order-section__row"
		>
			<div class="order-section__title">
				<a
					v-if="!orderIsLocked"
					:href="url('orders/admin/order/paymentMethod/form', {pk: order.order_id})"
					data-modal=""
				>
					{{ paymentMethodTitle }}
				</a>
				<span v-if="orderIsLocked">{{ paymentMethodTitle }}</span>
				<div v-if="Number(order.paymentMethod.mark_up) !== 0"
						 class="mt-2 text-muted"
				>
					<em>{{ __('Payment markup: %s%%', [order.paymentMethod.mark_up]) }}</em>
				</div>
			</div>
			<div class="order-section__total">
				<template v-if="totalCalculated && Number(totalCalculated.paymentMarkUp) !== 0">
					{{ formatMoney(totalCalculated.paymentMarkUp) }}
				</template>
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
import {mapState, mapMutations, mapActions} from 'vuex';

export default {
	computed: {
		...mapState(['order', 'orderIsLocked', 'totalCalculated']),
		paymentMethodTitle() {
			if (this.order?.paymentMethod?.paymentMethodTexts[0]) {
				return this.order?.paymentMethod?.paymentMethodTexts[0].title;
			}

			return null;
		}
	},
	mounted() {
		this.setPaymentMethod(this.order.paymentMethod);
		this.listenTo$(document, 'success.form', '.order-payment-method', (e, result) => {
			this.setPaymentMethod(result.paymentMethod);
		});
	},
	methods: {
		...mapMutations(['setPaymentMethod']),
		...mapActions(['rmPaymentMethod']),
		rm() {
			if (!confirm(this.__('Are you sure?'))) return;

			this.rmPaymentMethod();
		},
	}
};
</script>
