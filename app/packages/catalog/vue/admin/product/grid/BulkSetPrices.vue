<template>
	<form @submit.prevent="submit">
		<input
			v-for="productId in pk"
			:key="productId"
			type="hidden"
			name="pk[]"
			:value="productId"
		>
		<PriceRow
			:prices="prices"
			:values="priceValues"
			placeholder=""
		/>
		<div class="text-center">
			<button
				class="btn btn-primary"
				type="submit"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/>
				{{ __('Set prices') }}
			</button>
		</div>
	</form>
</template>

<script>
import PriceRow from '../form/components/ProductForm/ProductTab/StockAndPrice/PriceRow.vue';

export default {
	components: {
		PriceRow
	},
	props: ['prices', 'priceValues', 'pk'],
	methods: {
		submit() {
			this.$form(this.$el).submit(['catalog/admin/product/bulk/setPrices']);
		}
	}
};
</script>