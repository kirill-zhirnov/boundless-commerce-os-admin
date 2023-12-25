<template>
	<div class="set-stock">
		<template v-if="trackInventory">
			<div
				v-for="location in locations"
				:key="location.location_id"
				class="form-group"
			>
				<label class="form-label">
					<span class="stock">{{ __('Stock') }}</span>
					{{ location.title }}
				</label>
				<QtyRow
					:stock-values="stockValues"
					:location="location"
					:show-diff="showDiff"
					:show-totals="showTotals"
				/>
			</div>
		</template>
		<div v-else>
			<AvailableRow :available-qty="availableQty" />
			<div class="tinted-box">
				<div class="text-muted small">
					<i
						class="fa fa-info-circle"
						aria-hidden="true"
					/> {{ __('Inventory tracking is disabled in the Product Type.') }}
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import {mapState} from 'vuex';
import AvailableRow from './Stock/AvailableRow.vue';
import QtyRow from './Stock/QtyRow.vue';

export default {
	components: {
		QtyRow,
		AvailableRow
	},
	props: {
		locations: {
			default: []
		},
		stockValues: {
			default: {}
		},
		showDiff: {
			default: true
		},
		showTotals: {
			default: true
		},
		availableQty: {
			default: 0
		},
	},
	data() {
		return {};
	},
	computed: {
		...mapState([
			'trackInventory'
		])
	}
};
</script>
