<template>
	<section class="order-section">
		<div class="order-section__row">
			<div class="order-section__title text-end">
				<h4 class="mt-0 mb-0 me-2">{{ __('Total: ') }}</h4>
			</div>
			<div class="order-section__total">
				<h4 class="m-0">
					<template v-if="totalCalculated">
						{{ formatMoney(totalCalculated.price) }}
					</template>
				</h4>
			</div>
			<div class="order-section__rm"></div>
		</div>
	</section>
</template>
<script>
import {mapState} from 'vuex';

export default {
	computed: {
		...mapState(['totalCalculated'])
	},
};
</script>