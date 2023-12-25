<template>
	<form @submit.prevent="submit">
		<div class="form-group">
			<label class="form-label"> {{ __("Shipping:") }} </label>
			<div
				v-for="row in options.shipping"
				:key="row[0]"
				class="radio form-check"
			>
				<label class="form-check-label">
					<input
						v-model="form.shipping"
						class="form-check-input"
						type="radio"
						name="shipping"
						:value="row[0]"
						@input="onInput(row[0])"
					>
					{{ row[1] }}
				</label>
			</div>
		</div>
		<div
			v-if="form.shipping==='custom'"
			class="form-group"
		>
			<label
				class="form-label"
				for="custom_title"
			> {{ __("Title:") }} </label>
			<input
				id="custom_title"
				v-model="form.custom_title"
				class="form-control"
				name="custom_title"
			>
		</div>
		<div class="form-group">
			<label
				class="form-label"
				for="shipping_rate"
			> {{ __("Rate:") }} </label>
			<div class="input-group">
				<input
					id="shipping_rate"
					v-model="form.rate"
					class="form-control"
					name="rate"
					type="number"
					step="0.01"
				>
				<span class="input-group-text">{{ getLocale().getCurrencySymbol() }}</span>
			</div>
		</div>

		<div class="form-group">
			<label
				class="form-label"
				for="text_info"
			> {{ __("Additional info:") }} </label>
			<textarea
				id="text_info"
				v-model="form.text_info"
				rows="2"
				name="text_info"
				class="form-control"
			/>
		</div>
		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/> {{ __('Save') }}
			</button>
		</div>
	</form>
</template>
<script>
import {mapActions} from 'vuex';

export default {
	props: ['attrs', 'options', 'orderId'],
	data() {
		return {
			form: this.attrs || {}
		};
	},
	methods: {
		...mapActions(['getShippingInfo']),
		onInput(method) {
			if (method !== 'custom') {
				this.form.rate = this.options.shipping.find(el => el[0] === method)[2].price || 0;
			} else {
				this.form.rate = 0;
			}
		},
		submit() {
			this.$form(this.$el).submit(['orders/admin/order/shipping/edit', {order: this.orderId}])
				.then((res) => {
					if (res) {
						this.getShippingInfo({orderId: this.orderId});
					}
				});
		}
	}
};
</script>