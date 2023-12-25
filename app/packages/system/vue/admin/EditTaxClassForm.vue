<template>
	<form @submit.prevent="save">
		<div class="row">
			<div class="col-md-6 offset-md-3 col-xl-4 offset-xl-4">
				<div class="form-group">
					<label
						class="form-label"
						for="tax_class_title"
					> {{ __('Title') }} </label>
					<input type="text"
								 name="title"
								 class="form-control"
								 v-model="attrs.title"
								 id="tax_class_title"
								 required
					/>
				</div>
				<div class="form-group">
					<div class="form-check">
						<input class="form-check-input"
									 type="checkbox"
									 id="tax_class_is_default"
									 name="is_default"
									 v-model="attrs.is_default"
									 value="1"
						/>
						<label class="form-check-label" for="tax_class_is_default">
							{{ __('Use as default Tax Class') }}
						</label>
					</div>
				</div>
			</div>
		</div>
		<h3 class="mt-5"> {{ __('Tax Rates') }} </h3>
		<div class="table-responsive">
			<table class="table table-striped table-hover">
				<thead>
					<tr>
						<th scope="col" class="text-nowrap">{{ __('Country') }}</th>
						<th scope="col" class="text-nowrap">{{ __('State code') }}</th>
						<th scope="col" class="text-nowrap">{{ __('Tax name') }}</th>
						<th scope="col" class="text-nowrap">{{ __('Rate (%)') }}</th>
						<th scope="col" class="text-nowrap">{{ __('Priority') }}</th>
						<th scope="col" class="text-nowrap">{{ __('Compound') }}</th>
						<th scope="col" class="text-nowrap">{{ __('Include Shipping') }}</th>
						<th scope="col"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in attrs.taxRates"
							:key="row.tax_rate_id"
					>
						<td>
							<select v-model="row.country_id" class="form-select">
								<option :value="null">{{ __('All countries') }}</option>
								<option v-for="country in form.options.country"
												:key="country[0]"
												:value="country[0]"
								>{{country[1]}}</option>
							</select>
						</td>
						<td>
							<input class="form-control rates-state-input"
										 v-model="row.state_code"
										 maxlength="10"
										 :placeholder="__('All states')" />

						</td>
						<td>
							<input class="form-control" v-model="row.title" />
						</td>
						<td>
							<input class="form-control rates-rates-input"
										 v-model="row.rate"
										 type="number"
										 step="0.0001"
							/>
						</td>
						<td>
							<input class="form-control rates-priority-input"
										 v-model="row.priority"
										 type="number"
										 step="1"
										 min="0"
							/>
						</td>
						<td class="text-center">
							<input class="form-check-input"
										 type="checkbox"
										 value="1"
										 v-model="row.is_compound"
							/>
						</td>
						<td class="text-center">
							<input class="form-check-input"
										 type="checkbox"
										 value="1"
										 v-model="row.include_shipping"
							/>
						</td>
						<td>
							<button type="button"
											class="btn btn-outline-secondary btn-sm"
											@click.prevent="rmTaxRate(row.tax_rate_id)"
							>
								<i class="fa fa-trash" aria-hidden="true"></i>
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="my-3 text-end">
			<a href="#"
				 class="btn btn-outline-secondary btn-sm"
				 @click.prevent="addTaxRate"
			>
				<i class="fa fa-plus me-1"></i> {{ __('Add Tax Rate') }}
			</a>
		</div>
		<div class="buttons">
			<button type="submit"
							class="btn btn-primary save"
			>
				<i class="fa fa-floppy-o me-1"></i>
				{{ __('Save') }}
			</button>
		</div>
	</form>
</template>
<script>
export default {
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs
		};
	},

	methods: {
		save() {
			this.$form(this.$el).submit(
				['system/admin/tax/editTaxClass'],
				true,
				Object.assign({pk: this.form.pk}, this.attrs)
			);
		},
		addTaxRate() {
			this.$ajax.post(['system/admin/tax/addTaxRate'], {taxClassId: this.form.pk})
				.then(({taxRate}) => this.attrs.taxRates.push(taxRate));
		},
		rmTaxRate(taxRateId) {
			if (!confirm(this.__('Are you sure?'))) {
				return;
			}

			const index = this.attrs.taxRates.findIndex(({tax_rate_id}) => tax_rate_id == taxRateId);
			if (index !== -1) {
				this.attrs.taxRates.splice(index, 1);
			}

			this.$ajax.post(['system/admin/tax/rmTaxRate'], {taxRateId});
		}
	}
};
</script>
<style scoped>
.rates-state-input {
	max-width: 120px;
}

.rates-rates-input {
	max-width: 140px;
}

.rates-priority-input {
	max-width: 120px;
}
</style>