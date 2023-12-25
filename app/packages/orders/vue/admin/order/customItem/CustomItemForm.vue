<template>
	<form
		name="order-custom-item"
		class="order-custom-item"
		@submit.prevent="submit"
	>
		<input
			v-if="form.pk"
			type="hidden"
			name="pk"
			:value="form.pk"
		>
		<div class="form-group">
			<label
				class="form-label"
				for="custom_item_title"
			>
				{{ __('Item Name') }}
			</label>
			<input
				id="custom_item_title"
				v-model="attrs.title"
				type="text"
				name="title"
				class="form-control"
			>
		</div>
		<div class="row">
			<div class="col-sm-6">
				<div class="form-group">
					<label
						class="form-label"
						for="custom_item_price"
					>
						{{ __('Price') }}
					</label>
					<div class="input-group">
						<input
							id="custom_item_price"
							v-model="attrs.price"
							type="number"
							name="price"
							class="form-control"
							min="0"
							step="0.01"
						>
						<div class="input-group-text">
							{{ getLocale().getCurrencySymbol() }}
						</div>
					</div>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="form-group">
					<label
						class="form-label"
						for="custom_item_qty"
					>
						{{ __('Quantity') }}
					</label>
					<input
						id="custom_item_qty"
						v-model="attrs.qty"
						type="number"
						name="qty"
						class="form-control"
						min="0"
					>
				</div>
			</div>
		</div>
		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary"
			>
				{{ __('Submit') }}
			</button>
		</div>
	</form>
</template>

<script>
import {mapMutations} from 'vuex';

export default {
	props: ['form'],
	data() {
		return {
			attrs: this.form.attrs
		};
	},
	mounted() {
		// console.log('form:', this.form);
	},
	methods: {
		...mapMutations(['addOrReplaceItem']),
		submit() {
			this.$form(this.$el).submit(['orders/admin/order/items/customItem', {order: this.form.orderId}])
				.then((data) => {
					this.addOrReplaceItem(data.item);
				});
		}
	}
};
</script>