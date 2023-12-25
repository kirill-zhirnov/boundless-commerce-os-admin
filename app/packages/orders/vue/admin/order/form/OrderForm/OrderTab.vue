<template>
	<div class="order-tab">
		<div class="row mb-5">
			<div class="col-md-8 col-xxl-9">
				<div v-if="orderIsLocked"
						 class="alert alert-warning mb-4"
						 role="alert"
				>
					{{ __('The content of the order cannot be changed, because the status of the order is shipped, completed (or has similar meaning).') }}
					{{ __('To make changes in the order - please modify and save the order status.') }}
				</div>
				<ProductsForm />
				<DiscountsForm />
				<ShippingForm />
				<PaymentMethod />
				<TaxRow />
				<TotalForm />
			</div>
			<div class="col-md-4 col-xxl-3">
				<StatusForm :form="forms.status" />
				<CustomerForm :order="forms.order.pk" />
			</div>
		</div>
		<div v-if="clientComment" class="mb-5">
			<h4>{{__('Client comment')}}</h4>
			<div v-html="clientComment" class="blockquote" />
		</div>
		<div class="row">
			<div class="col-sm-8 offset-sm-0 col-md-6 offset-md-1">
				<Widget
					path="system.adminComment.@c"
					:params="{data: {pk: forms.order.pk, type: 'orders'}}"
				/>
			</div>
		</div>
	</div>
</template>
<script>
import StatusForm from './OrderTab/StatusForm.vue';
import ProductsForm from './OrderTab/ProductsForm.vue';
import ShippingForm from './OrderTab/ShippingForm.vue';
import DiscountsForm from './OrderTab/DiscountsForm.vue';
import TotalForm from './OrderTab/TotalForm.vue';
import CustomerForm from './OrderTab/CustomerForm.vue';
import PaymentMethod from './OrderTab/PaymentMethod.vue';
import Widget from '../../../../../../../vue/components/Widget.vue';
import {mapState} from 'vuex';
import TaxRow from './OrderTab/TaxRow.vue';
import gHtml from '../../../../../../../modules/gHtml/index.client';

export default {
	components: {
		StatusForm,
		ProductsForm,
		ShippingForm,
		DiscountsForm,
		TotalForm,
		CustomerForm,
		Widget,
		PaymentMethod,
		TaxRow
	},
	computed: {
		clientComment() {
			if (this.forms.order.record.orderProp.client_comment) {
				return gHtml.nl2br(gHtml.escape(this.forms.order.record.orderProp.client_comment));
			}

			return null;
		},
		...mapState(['orderIsLocked'])
	},
	props: ['forms']
};
</script>