<template>
	<form
		name="props"
		@submit.prevent="$emit('submit')"
	>
		<div
			v-if="attrs.manufacturer_id != 'create'"
			class="form-group"
		>
			<label
				class="form-label"
				for="product_manufacturer_id"
			>
				{{ __('Manufacturer') }}
			</label>
			<select
				id="product_manufacturer_id"
				v-model="attrs.manufacturer_id"
				name="manufacturer_id"
				class="form-select"
			>
				<option
					v-for="row in options.manufacturer"
					:key="row[0]"
					:value="row[0]"
				>
					{{ row[1] }}
				</option>
			</select>
		</div>
		<div
			v-else
			ref="createMnf"
			class="tinted-box mb-2"
		>
			<div class="form-group">
				<div class="input-group input-group-sm">
					<input
						ref="mnfTitle"
						type="text"
						name="manufacturer_title"
						class="form-control"
						:placeholder="__('Title')"
						@keydown.13.prevent="submitMnf"
					>
					<button
						class="btn btn-outline-secondary"
						href="#"
						@click.prevent="submitMnf"
					>
						<i
							class="fa fa-plus-circle"
							aria-hidden="true"
						/>
						{{ __('Create manufacturer') }}
					</button>
				</div>
			</div>
			<div class="text-end">
				<a
					href="#"
					class="small"
					@click.prevent="attrs.manufacturer_id = prevManufacturerId"
				>{{ __('Cancel') }}</a>
			</div>
		</div>
		<div
			v-if="attrs.manufacturer_id != 'create'"
			class="form-group"
		>
			<label
				class="form-label"
				for="product_country_of_origin"
			>
				{{ __('Country of origin') }}
			</label>
			<select
				id="product_country_of_origin"
				v-model="attrs.country_of_origin"
				name="country_of_origin"
				class="form-select"
			>
				<option
					v-for="row in options.countryOfOrigin"
					:key="row[0]"
					:value="row[0]"
				>
					{{ row[1] }}
				</option>
			</select>
		</div>
		<div class="form-group">
			<label
				class="form-label"
				for="product_external_id"
			>
				{{ __('ID in external database') }}
			</label>
			<input
				id="product_external_id"
				v-model="attrs.external_id"
				type="text"
				name="external_id"
				class="form-control"
			>
			<p class="form-text">
				{{ __('E.g. ID in supplier database or 1C, etc.') }}
			</p>
		</div>
	</form>
</template>
<script>
export default {
	props: ['form'],

	data() {
		return {
			attrs: {},
			prevManufacturerId: null,
			options: {}
		};
	},

	watch: {
		'attrs.manufacturer_id': function(val, prevVal) {
			if (val == 'create') {
				this.prevManufacturerId = prevVal;

				this.$nextTick(() => {
					this.$refs.mnfTitle.focus();
				});
			} else {
				if (prevVal && /^\d+$/.test(prevVal)) {
					this.prevManufacturerId = prevVal;
				}
			}
		},
	},

	beforeMount() {
		this.options = this.form.options;
		this.attrs = this.form.attrs;
	},

	methods: {
		submitMnf() {
			this.$form(this.$refs.createMnf).submit(this.url('catalog/admin/manufacturer/quickEdit', {createOption: 1}))
				.then((result) => {
					this.options.manufacturer = result.options;
					this.attrs.manufacturer_id = result.pk;
				});
		}
	}
};
</script>