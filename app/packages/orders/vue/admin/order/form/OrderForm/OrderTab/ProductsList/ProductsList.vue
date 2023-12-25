<template>
	<div>
		<form name="qty">
			<div class="table-responsive">
				<table class="table table-striped table-hover order-items">
					<thead>
					<tr>
						<th class="order-items__col-product">{{ __("Product") }}</th>
						<th class="order-items__col-qty">{{ __("Quantity") }}</th>
						<th class="order-items__col-total">{{ __("Total") }}</th>
						<th class="order-items__col-rm" />
					</tr>
					</thead>
					<tbody>
					<ProductItem
						v-for="item in orderList"
						:key="item.item_id"
						:item="item"
					/>
					<Subtotal />
					</tbody>
				</table>
			</div>
		</form>
	</div>
</template>
<script>
import {mapState, mapActions} from 'vuex';
import ProductItem from './ProductItem.vue';
import Subtotal from './Subtotal.vue';
// TODO: add translation
export default {
	components: {
		ProductItem,
		Subtotal
	},
	computed: {
		...mapState(['order', 'orderIsLocked', 'orderList'])
	},
	mounted() {
		this.getOrderItemsList({orderId: this.order.order_id});
	},
	methods: {
		...mapActions(['getOrderItemsList'])
	}
};
</script>
