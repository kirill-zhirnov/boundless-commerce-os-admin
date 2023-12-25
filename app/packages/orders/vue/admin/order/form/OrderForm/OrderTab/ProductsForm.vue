<template>
	<section class="products-section">
		<h4>{{ __('Products') }}</h4>
		<p>
			<template v-if="!orderIsLocked">
				<a
					:href="url('orders/admin/order/items/modal', {pk: order.order_id})"
					data-modal=""
					class="btn btn-outline-secondary me-2"
				>
					<i
						class="fa fa-plus me-2"
						aria-hidden="true"
					/>{{ __('Add product(s)') }}
				</a>
				<a
					:href="url('orders/admin/order/items/customItem', {order: order.order_id})"
					data-modal=""
					class="btn btn-outline-secondary"
				>
					<i
						class="fa fa-plus me-2"
						aria-hidden="true"
					/>{{ __('Add custom item') }}
				</a>
			</template>
			<template v-else>
				<button disabled="disabled" class="btn btn-outline-secondary me-2">
					<i class="fa fa-plus" aria-hidden="true"/> {{ __('Add product(s)') }}
				</button>
				<button disabled="disabled" class="btn btn-outline-secondary me-2">
					<i class="fa fa-plus" aria-hidden="true"/> {{ __('Add custom item') }}
				</button>
			</template>
		</p>
		<ProductsList />
	</section>
</template>
<script>
import {mapState, mapActions} from 'vuex';
import ProductsList from './ProductsList/ProductsList.vue';

export default {
	components: {
		ProductsList,
	},
	computed: {
		...mapState([
			'order',
			'orderIsLocked'
		])
	}
};
</script>