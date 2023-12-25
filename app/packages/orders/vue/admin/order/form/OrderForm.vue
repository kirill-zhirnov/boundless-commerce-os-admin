<template>
	<div class="content">
		<div class="order-form__top-links">
			<a :href="url('orders/admin/orders/index', gridParams)">
				<i class="fa fa-arrow-left" aria-hidden="true"/> {{ __('Orders') }}
			</a>
		</div>
		<div class="mb-4">
			<OrderTab
				v-show="tab == 'main'"
				:forms="forms"
			/>
			<AttributesTab
				v-show="tab == 'attributes'"
				:forms="forms"
			/>
			<AdditionTab
				v-show="tab == 'additions'"
			/>
		</div>
		<div class="text-center mb-4">
			<SaveButton />
		</div>
	</div>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import SaveButton from './TopNav/SaveButton.vue';
import OrderTab from './OrderForm/OrderTab.vue';
import AttributesTab from './AttributesForm/AttributesTab.vue';
import AdditionTab from './Additions/AdditionTab.vue';
import _ from 'underscore';

export default {
	components: {
		SaveButton,
		OrderTab,
		AttributesTab,
		AdditionTab
	},
	props: ['forms'],
	computed: {
		...mapState([
			'tab',
			'gridParams',
			'submitCounter',
			'orderList',
			'shipping',
			'discounts',
			'order',
			'taxSettings',
			'taxClasses',
			'customer'
		]),
		totalHasChanged() {
			const value = [
				`${JSON.stringify(this.orderList)}`, `${JSON.stringify(this.shipping)}`, `${JSON.stringify(this.discounts)}`,
				`${JSON.stringify(this.order)}`, `${JSON.stringify(this.taxSettings)}`, `${JSON.stringify(this.taxClasses)}`,
				`${JSON.stringify(this.customer)}`
			];

			return value.join('|');
		}
	},
	watch: {
		submitCounter() {
			this.execSubmit();
		},
		totalHasChanged: _.debounce(function() {
			this.calcTotal();
		}, 300)
	},
	methods: {
		execSubmit() {
			this.setLoading(true);
			this.setTabWithErr([]);
			this.$formGroup(this.$el).submit(['orders/admin/orders/form', {pk: this.forms.order.pk}])
				.then((result) => {
					this.setLoading(false);
					this.formSaved();
					this.setOrder(result.record);
					this.setOrderIsLocked(result.orderIsLocked || false);
				})
				.catch((err) => {
					this.setLoading(false);
				})
			;
		},
		...mapMutations([
			'setLoading', 'setTabWithErr', 'formSaved', 'setOrder', 'setOrderIsLocked', 'calcTotal'
		])
	}
};

</script>