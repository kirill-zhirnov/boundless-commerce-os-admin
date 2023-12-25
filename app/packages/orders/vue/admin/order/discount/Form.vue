<template>
	<form
		@submit.prevent="submit"
	>
		<div class="discount-string">
			<div class="form-group discount-value">
				<label
					class="form-label"
					for="discount_value"
				>{{ __("Discount value:") }}</label>
				<div class="input-group">
					<input
						id="discount_value"
						v-model="form.value"
						class="form-control"
						name="value"
						type="number"
						step="0.01"
					>
					<span class="input-group-text">
						{{ form.discount_type === 'percent' ? '%' : getLocale().getCurrencySymbol() }}
					</span>
				</div>
			</div>
			<div class="form-group discount-type">
				<label class="form-label"> {{ __("Discount type:") }} </label>
				<div
					v-for="row in options.discount_type"
					:key="row[0]"
					class="radio mt-0 form-check"
				>
					<label class="form-check-label">
						<input
							v-model="form.discount_type"
							class="form-check-input"
							type="radio"
							name="discount_type"
							:value="row[0]"
						>
						{{ row[1] }}
					</label>
				</div>
			</div>
		</div>

		<div class="form-group">
			<label
				class="form-label"
				for="text_comment"
			> {{ __("Comment:") }} </label>
			<textarea
				id="text_comment"
				v-model="form.title"
				rows="2"
				type="text"
				name="title"
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
	props: ['attrs', 'options', 'orderId', 'pk'],
	data() {
		return {
			form: this.attrs || {}
		};
	},
	methods: {
		...mapActions(['getDiscounts']),
		async submit() 		{
			const res = await this.$form(this.$el).submit(['orders/admin/order/discount/form', {order: this.orderId, pk: this.pk}]);
			if (res) {
				this.getDiscounts({orderId: this.orderId});
			}
		}
	}
};
</script>