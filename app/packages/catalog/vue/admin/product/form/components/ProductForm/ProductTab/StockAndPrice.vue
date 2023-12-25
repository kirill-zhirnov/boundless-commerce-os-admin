<template>
	<form
		name="stockAndPrice"
		@submit.prevent="$emit('submit')"
	>
		<div class="row">
			<div
				v-if="showPrices"
				class="col-sm-6 col-prices"
			>
				<PriceRow
					:prices="form.prices"
					:values="form.priceValues"
				/>
			</div>
			<div class="col-sm-6 col-stock">
				<Stock
					:available-qty="form.availableQty"
					:locations="form.locations"
					:stock-values="form.stockValues"
				/>
			</div>
		</div>

		<!--need to have submit button to allow submit by enter-->
		<button
			type="submit"
			class="d-none"
		/>
	</form>
</template>
<script>
import Stock from './StockAndPrice/Stock.vue';
import PriceRow from './StockAndPrice/PriceRow.vue';

export default {
	components: {
		Stock,
		PriceRow
	},

	props: {
		form: {
			default: {}
		},
		showPrices: {
			default: true
		}
	},
};
</script>