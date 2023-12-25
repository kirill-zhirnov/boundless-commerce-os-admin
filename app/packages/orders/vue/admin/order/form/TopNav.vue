<template>
	<div class="color-wrapper">
		<div class="container-wrapper">
			<div class="title-row">
				<div class="title">
					<span v-if="order">
						<span
							v-if="order.publishing_status === 'draft'"
							style="color: #ccc;"
						>{{ __('Create an order') }}</span>
						<span
							v-else
						>{{ __('Order #%s', [order.order_id]) }}</span>
					</span>
				</div>
				<transition enter-active-class="animated shake">
					<Buttons v-if="tabWithErr.length > 0" />
				</transition>
				<Buttons v-if="!tabWithErr.length" />
			</div>
			<OrderTabs />
		</div>
	</div>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import OrderTabs from './OrderTabs.vue';
import Buttons from './TopNav/Buttons.vue';

export default {
	components: {
		Buttons,
		OrderTabs
	},

	props: ['forms', 'grid'],

	computed: {
		...mapState([
			'tabWithErr',
			'order'
		])
	},

	created() {
		this.setOrder(this.forms.order.record);
		this.setOrderIsLocked(this.forms.order.orderIsLocked);
		this.setGridParams(this.grid);
		this.setTaxSettings(this.forms.order.taxSettings);
		this.setTaxClasses(this.forms.order.taxClasses);
	},

	methods: {
		...mapMutations([
			'setOrder',
			'setGridParams',
			'setOrderIsLocked',
			'setTaxSettings',
			'setTaxClasses'
		])
	},
};

</script>