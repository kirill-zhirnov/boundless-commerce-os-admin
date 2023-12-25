<template>
	<form @submit.prevent="save">
		<div class="form-group">
			<label class="form-label"> {{ __('Choose what to export:') }} </label>
			<div class="radio form-check">
				<label class="form-check-label">
					<input
						v-model="attrs.type"
						class="form-check-input"
						type="radio"
						name="type"
						value="products"
					> {{ __('Only products') }}
				</label>
				<div class="form-text">
					{{ __('Useful if you need only products, without modifications.') }}
				</div>
			</div>
			<div class="radio form-check">
				<label class="form-check-label">
					<input
						v-model="attrs.type"
						class="form-check-input"
						type="radio"
						name="type"
						value="productsAndVariants"
					> {{ __('Products and variants') }}
				</label>
				<div class="form-text">
					{{ __('Full catalog. Useful for exporting in warehouse management software.') }}
				</div>
			</div>
		</div>
		<p class="small">
			<a
				href="#"
				@click.prevent="showAdditionalSettings = !showAdditionalSettings"
			>
				<i
					class="fa"
					:class="(showAdditionalSettings) ? 'fa-caret-down' : 'fa-caret-right'"
				/> {{ __('Additional settings') }}
			</a>
		</p>
		<transition enter-active-class="animated fadeIn">
			<div
				v-show="showAdditionalSettings"
				class="additional-settings"
			>
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							v-model="attrs.descriptionAsHtml"
							class="form-check-input"
							type="checkbox"
							name="descriptionAsHtml"
							value="1"
						> <i class="fa fa-code" /> {{ __('Export description as HTML') }}
					</label>
				</div>
			</div>
		</transition>
		<div class="text-center buttons">
			<button
				type="submit"
				class="btn btn-primary"
			>
				<i class="fa fa-cloud-download" /> {{ __('Download') }}
			</button>
		</div>
	</form>
</template>

<script>
export default {
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs,
			showAdditionalSettings: false
		};
	},

	methods: {
		save() {
			this.$form(this.$el).submit(['catalog/admin/product/export/form', {grid: this.form.grid, export: this.form.export}]);
		},
	}
};
</script>