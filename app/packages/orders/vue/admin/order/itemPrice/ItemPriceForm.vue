<template>
	<form
		@submit.prevent="submit"
	>
		<input
			type="hidden"
			name="pk"
			:value="form.pk"
		>

		<div class="form-group">
			<label
				class="form-label"
				for="item_price_basic_price"
			>
				{{ __('Price in the order:') }}
			</label>
			<div class="input-group">
				<input
					id="item_price_basic_price"
					v-model="attrs.basic_price"
					type="number"
					class="form-control"
					name="basic_price"
					min="0"
					step="0.01"
				>
				<div class="input-group-text">
					{{ getLocale().getCurrencySymbol() }}
				</div>
			</div>
		</div>

		<div class="form-group">
			<label>
				{{ __('Discount type:') }}
			</label>
			<div class="radios">
				<div
					v-for="box in form.options.type"
					:key="box[0]"
					class="radio-inline form-check form-check-inline"
				>
					<label class="form-check-label">
						<input
							v-model="attrs.type"
							class="form-check-input"
							type="radio"
							:value="box[0]"
							name="type"
						>
						{{ box[1] }}
					</label>
				</div>
			</div>
		</div>

		<div
			v-if="attrs.type !== 'no'"
			class="form-group"
		>
			<label
				class="form-label"
				for="item_price_discount_value"
			>{{ __('Discount value:') }}</label>
			<div class="input-group">
				<input
					id="item_price_discount_value"
					v-model="attrs.discount_value"
					type="number"
					class="form-control"
					name="discount_value"
					:max="attrs.type === 'percentage' ? 100 : undefined"
					min="0"
					step="0.01"
				>
				<div class="input-group-text">
					{{
						attrs.type === 'percentage'
							? "%"
							: getLocale().getCurrencySymbol()
					}}
				</div>
			</div>
		</div>

		<h4>
			{{ __('Final price:') }} {{ formatMoney(finalPrice) }}
		</h4>

		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary text-center"
			>
				{{ __('Submit') }}
			</button>
		</div>
	</form>
</template>

<script>
import {calcFinalPrice} from '../../../../components/priceCalculator.ts';
import {mapMutations} from 'vuex';

export default {
	props: ['form'],
	data() {
		return {
			attrs: this.form.attrs
		};
	},
	computed: {
		finalPrice: function() {
			return calcFinalPrice(
				this.attrs.basic_price,
				this.attrs.type === 'amount' ? this.attrs.discount_value : null,
				this.attrs.type === 'percentage' ? this.attrs.discount_value : null,
			);
		}
	},
	mounted() {
		// console.log('form:', this.form);
	},
	methods: {
		...mapMutations(['changeSingleItemPrice']),
		submit() {
			this.$form(this.$el).submit(['orders/admin/order/items/price', {order: this.form.orderId}])
				.then((data) => {
					this.changeSingleItemPrice({...data.price, item_id: data.pk});
				});
		}
	},
};
</script>