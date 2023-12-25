<template>
	<div class="form-group">
		<label
			class="form-label"
			for="in_stock"
		>{{ __('Is in stock?:') }}</label>
		<select
			v-if="isBulk"
			id="in_stock"
			v-model="available"
			name="available_qty"
			class="form-select"
		>
			<option
				v-if="isBulk"
				value=""
			>
				{{ __('Do not modify') }}
			</option>
			<option :value="1">
				{{ __('Yes') }}
			</option>
			<option :value="2">
				{{ __('No') }}
			</option>
		</select>
		<div v-else>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="available_qty"
					v-model="available"
					id="in_stock-radio-yes"
					:value="1"
				>
				<label class="form-check-label" for="in_stock-radio-yes">
					{{ __('Yes') }}
				</label>
			</div>
			<div class="form-check form-check-inline">
				<input
					class="form-check-input"
					type="radio"
					name="available_qty"
					v-model="available"
					id="in_stock-radio-no"
					:value="0"
				>
				<label class="form-check-label" for="in_stock-radio-no">
					{{ __('No') }}
				</label>
			</div>
		</div>
	</div>
</template>
<script>

export default {
	props: ['availableQty', 'isBulk'],

	data() {
		return {
			available: this.isBulk ? '' : (this.availableQty > 0 ? 1 : 0)
		};
	},
};
</script>