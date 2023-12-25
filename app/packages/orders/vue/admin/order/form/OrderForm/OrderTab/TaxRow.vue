<template>
	<section class="order-section">
		<div v-if="taxSettings.turnedOn"
				 class="order-section__row"
		>
			<div class="order-section__title text-end">
				<h4 class="mt-0 mb-0 me-2">
					<template v-if="taxSettings.pricesEnteredWithTax">
						{{ __('Tax (inclusive): ') }}
					</template>
					<template v-else>{{ __('Tax (exclusive): ') }}</template>
				</h4>
			</div>
			<div class="order-section__total">
				<h4 class="m-0">
					<template v-if="totalCalculated && totalCalculated.tax.totalTaxAmount">
						{{ formatMoney(totalCalculated.tax.totalTaxAmount) }}
					</template>
				</h4>
			</div>
			<div class="order-section__rm"></div>
		</div>
		<template v-else>
			<div class="small text-muted">
				{{ __('Tax calculation is turned off in settings.') }}
			</div>
		</template>
	</section>
</template>
<script>
import {mapState} from 'vuex';

export default {
	computed: {
		...mapState(['totalCalculated', 'taxSettings'])
	},
};
</script>