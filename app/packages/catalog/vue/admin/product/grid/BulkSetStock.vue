<template>
	<form @submit.prevent="submit">
		<input
			v-for="productId in pk"
			:key="productId"
			type="hidden"
			name="pk[]"
			:value="productId"
		>
		<label>{{ __('For products which inventory is tracked, set stock') }}</label>
		<div class="set-stock">
			<div
				v-for="location in locations"
				:key="location.location_id"
				class="form-group"
			>
				<label class="form-label">
					<span class="stock">{{ __('Stock') }}</span>
					{{ location.title }}
				</label>
				<div class="qty">
					<input
						type="number"
						class="form-control"
						min="0"
						:name="`qty[l-${location.location_id}]`"
					>
				</div>
			</div>
		</div>
		<div class="well well-sm small text-muted">
			<i
				class="fa fa-info-circle"
				aria-hidden="true"
			/>
			{{ __('If product has variants - stock will be set by each variant.') }}
		</div>
		<label>{{ __('For products which inventory is not tracked, set availability') }}</label>
		<AvailableRow :is-bulk="true" />
		<div class="text-center">
			<button
				class="btn btn-primary"
				type="submit"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/>
				{{ __('Set stock') }}
			</button>
		</div>
	</form>
</template>

<script>
import AvailableRow from '../form/components/ProductForm/ProductTab/StockAndPrice/Stock/AvailableRow.vue';

export default {

	components: {AvailableRow},
	props: ['locations', 'pk', 'stockValues'],

	methods: {
		submit() {
			this.$form(this.$el).submit(['catalog/admin/product/bulk/setStock']);
		}
	},
};
</script>