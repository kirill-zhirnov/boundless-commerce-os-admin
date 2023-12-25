<template>
	<div class="order-tab">
		<div class="row">
			<div class="col-sm-8">
				<h3>{{ __("Attributes") }}</h3>
				<AttributesList
					v-if="fetched"
					:attributes="attributes"
					:values="values"
					:add-url="url('orders/admin/order/customAttrs/form', { order: order.order_id })"
					edit-url="orders/admin/order/customAttrs/form"
				/>
			</div>
			<div class="col-sm-4 col-right">
				<TrackingNumbers />
			</div>
		</div>
	</div>
</template>
<script>
import {mapActions, mapMutations, mapState} from 'vuex';
import AttributesList from './AttributesTab/AttributesList.vue';
import TrackingNumbers from './AttributesTab/TrackingNumbers.vue';

export default {
	components: {
		AttributesList,
		TrackingNumbers
	},
	props: ['forms'],
	data() {
		return {
			values: {},
			fetched: false
		};
	},
	computed: {
		...mapState([
			'order',
			'orderIsLocked',
			'attributes',
			'attributesValues',
			'removedAttr',
			'tab'
		]),
	},

	watch: {
		tab() {
			if (this.tab === 'attributes' && !this.fetched) {
				this.getOrderAttributes().then(() => {
					this.values = {...this.attributesValues};
					this.fetched = true;
				});
			}
		},
		removedAttr(removed) {
			if (!removed.length) return;

			for (const key of removed) {
				delete this.values[key];
			}
			this.setRemovedAttr([]);
		}
	},
	methods: {
		...mapActions(['getOrderAttributes']),
		...mapMutations(['setRemovedAttr'])
	}

};
</script>