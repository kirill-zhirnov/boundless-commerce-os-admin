<template>
	<tr>
		<td class="text-end">
			<h4 class="m-0">{{ __("Subtotal: ") }}</h4>
		</td>
		<td class="text-center">
			<h4 class="m-0">
				<template v-if="totalCalculated">
					{{ totalCalculated.itemsSubTotal.qty }}
				</template>
			</h4>
		</td>
		<td class="col-total text-center">
			<h4 class="m-0 text-nowrap">
				<template v-if="totalCalculated">
					{{ formatMoney(totalCalculated.itemsSubTotal.price) }}
				</template>
			</h4>
		</td>
		<td class="col-remove" />
	</tr>
</template>
<script>
import {mapState} from 'vuex';

export default {
	computed: {
		...mapState(['totalCalculated']),
	},
};
</script>