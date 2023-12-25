<template>
	<div class="qty">
		<div class="input-group">
			<input
				v-model="qty"
				type="number"
				class="form-control"
				min="0"
				:name="`qty[l-${location.location_id}]`"
			>
			<span class="input-group-text">{{ commodityGroup.unit }}</span>
		</div>
		<div
			v-show="showDiff && diff != 0 && !isNaN(diff)"
			class="diff"
			:class="(diff < 0) ? 'negative' : ''"
		>
			<template v-if="diff > 0">
				+
			</template>
			{{ diff }}
		</div>
		<div
			v-if="showTotals"
			class="totals small"
		>
			<div class="reserved">
				{{ __('Reserved:') }}
				{{ stockValues[location.location_id].reserved_qty }}
			</div>
			<div class="total">
				{{ __('Total:') }}
				<b>{{ total }}</b>
			</div>
		</div>
	</div>
</template>
<script>
import {mapState, mapMutations} from 'vuex';

export default {
	props: ['location', 'stockValues', 'showDiff', 'showTotals'],

	data() {
		return {
			initialQty: 0,
			qty: 0
		};
	},

	computed: {
		total() {
			return (parseInt(this.qty) || 0) + parseInt(this.stockValues[this.location.location_id].reserved_qty);
		},

		diff() {
			return parseInt(this.qty) - this.initialQty;
		},

		...mapState([
			'commodityGroup',
			'saved'
		])
	},

	watch: {
		saved() {
			if (!this.saved)
				return;

			this.initialQty = parseInt(this.qty);
		},

		qty() {
			if (!this.showDiff)
				return;

			this.setSaved(false);
		}
	},

	beforeMount() {
		let qty = parseInt(this.stockValues[this.location.location_id].available_qty);

		this.qty = qty;
		this.initialQty = qty;
	},

	methods: {
		...mapMutations([
			'setSaved'
		])
	}
};
</script>