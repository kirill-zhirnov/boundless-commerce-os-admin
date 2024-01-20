<template>
	<div class="variant-form">
		<form
			name="variant"
			@submit.prevent="execSubmit"
		>
			<input
				type="hidden"
				name="pk"
				:value="variant.pk"
			>

			<!--<div class="form-group">-->
			<!--<label for="variant_title">-->
			<!--{{ __('Title') }} <sup>*</sup>-->
			<!--</label>-->
			<!--<input type="text"-->
			<!--name="title"-->
			<!--id="variant_title"-->
			<!--class="form-control"-->
			<!--v-model="variant.attrs.title"-->
			<!--required-->
			<!--&gt;-->
			<!--</div>-->
			<div class="form-group">
				<label
					class="form-label"
					for="variant_sku"
				>
					{{ __('Sku') }}
				</label>
				<div class="input-group">
					<span class="input-group-text">
						<i
							class="fa fa-barcode"
							aria-hidden="true"
						/>
					</span>
					<input
						id="variant_sku"
						v-model="variant.attrs.sku"
						type="text"
						class="form-control"
						name="sku"
					>
				</div>
			</div>
			<button
				type="submit"
				class="d-none"
			/>
		</form>
		<StockAndPrice
			:form="forms.stockAndPrice"
			@submit="execSubmit"
		/>
		<Size
			:form="forms.size"
			@submit="execSubmit"
		/>
		<div class="text-center mb-4">
			<a
				href="#"
				class="btn btn-primary"
				@click.prevent="execSubmit"
			>
				<i
					class="fa fa-check"
					aria-hidden="true"
				/> {{ __('Save') }}
			</a>
		</div>
		<p v-if="forms.variant.inventoryItem" class="small text-muted">
			{{ __('Variant ID: %s, Item ID: %s', [forms.variant.inventoryItem.variant_id, forms.variant.inventoryItem.item_id])}}
		</p>
	</div>
</template>
<script>
import StockAndPrice from './ProductForm/ProductTab/StockAndPrice.vue';
import Size from './ProductForm/VariantsTab/Size.vue';

import {mapMutations} from 'vuex';

export default {
	components: {
		StockAndPrice,
		Size
	},

	props: ['forms'],

	data() {
		return {
			variant: this.forms.variant
		};
	},

	methods: {
		execSubmit() {
			this.$formGroup(this.$el).submit(['catalog/admin/product/variant/form'])
				.then(() => this.upVariantsUpdated());
		},

		...mapMutations([
			'upVariantsUpdated'
		])
	},
};
</script>