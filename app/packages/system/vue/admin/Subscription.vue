<template>
	<div class="boundless-subscription">
		<div v-if="data.showPaymentAlert === 'success'" class="alert alert-success" >
			<strong>Thank you!</strong> The payment was successfully processed!
		</div>
		<div v-if="data.showPaymentAlert === 'cancel'" class="alert alert-warning" >
			The payment was cancelled!
		</div>
		<div class="row mb-5">
			<div class="col-md-8 offset-md-2 col-lg-6 offset-lg-3">
				<form
					ref="formEl"
					class="bg-light p-2 mb-3"
					@submit.prevent="save"
				>
					<h4>{{ __('Tariff') }}</h4>
					<div class="form-group">
						<select
							id="billing_tariff_id"
							v-model="attrs.tariff_id"
							class="form-select"
							name="tariff_id"
							:disabled="data.subscribeMode == 'updateBilling'"
						>
							<option
								v-for="row in data.options.tariff"
								:key="row[0]"
								:value="row[0]"
							>
								{{ row[1] }}
								<template v-if="Number(row[2]) !== 0">
									- {{ formatMoney(row[2], {precision: 2}) }}
								</template>
							</option>
						</select>
					</div>
					<div
						v-if="allowUnsubscribe === true && data.subscribeMode == 'updateBilling'"
					>
						<p v-if="data.instance.paid_till">
							{{ __('Next billing date: %s', [getLocale().formatDateTime(data.instance.paid_till, 'long')]) }}
						</p>
						<div class="form-group text-end">
							<button
								type="button"
								class="btn btn-outline-secondary btn-sm"
								@click.prevent="cancelSubscription"
							>
								<i
									class="fa fa-ban"
									aria-hidden="true"
								/> {{ __('Cancel subscription') }}
							</button>
						</div>
					</div>
					<p v-if="allowUnsubscribe === false && data.subscribeMode == 'updateBilling' && data.instance.paid_till">
						{{ __('Tariff available until: %s', [getLocale().formatDateTime(data.instance.paid_till, 'long')]) }}
					</p>
					<h4 class="mt-4">
						{{ __('Billing Address') }}
					</h4>
					<div class="row">
						<div class="col">
							<div class="form-group">
								<label
									class="form-label"
									for="billing_first_name"
								> {{ __('First Name') }} <sup>*</sup></label>
								<input
									id="billing_first_name"
									v-model="attrs.first_name"
									type="text"
									name="first_name"
									class="form-control"
									autocomplete="given-name"
									required
								>
							</div>
						</div>
						<div class="col">
							<div class="form-group">
								<label
									class="form-label"
									for="billing_last_name"
								> {{ __('Last Name') }} <sup>*</sup></label>
								<input
									id="billing_last_name"
									v-model="attrs.last_name"
									type="text"
									name="last_name"
									class="form-control"
									autocomplete="family-name"
									required
								>
							</div>
						</div>
					</div>
					<div class="form-group">
						<div class="checkbox form-check">
							<label class="form-check-label">
								<input
									v-model="attrs.is_company"
									class="form-check-input"
									type="checkbox"
									name="is_company"
									value="1"
								> {{ __('I represent a company') }}
							</label>
						</div>
					</div>
					<div
						v-if="attrs.is_company"
						class="form-group"
					>
						<label
							class="form-label"
							for="billing_company_name"
						> {{ __('Company Name') }} <sup>*</sup></label>
						<input
							id="billing_company_name"
							v-model="attrs.company_name"
							type="text"
							name="company_name"
							class="form-control"
							autocomplete="organization"
							required
						>
					</div>
					<div class="form-group">
						<label
							class="form-label"
							for="billing_vat_number"
						> {{ __('TAX/VAT Number') }} <sup v-if="attrs.is_company">*</sup></label>
						<input
							id="billing_vat_number"
							v-model="attrs.vat_number"
							type="text"
							name="vat_number"
							class="form-control"
							:required="attrs.is_company"
						>
					</div>
					<div class="row">
						<div class="col">
							<div class="form-group">
								<label
									class="form-label"
									for="billing_country_id"
								> {{ __('Country') }} <sup>*</sup></label>
								<select
									id="billing_country_id"
									v-model="attrs.country_id"
									class="form-select"
									name="country_id"
									autocomplete="country-name"
									required
								>
									<option
										v-for="row in data.options.country"
										:key="row[0]"
										:value="row[0]"
									>
										{{ row[1] }}
									</option>
								</select>
							</div>
						</div>
						<div class="col">
							<div class="form-group">
								<label
									class="form-label"
									for="billing_zip_code"
								> {{ __('Zip Code') }} <sup>*</sup></label>
								<input
									id="billing_zip_code"
									v-model="attrs.zip_code"
									type="text"
									name="zip_code"
									class="form-control"
									autocomplete="postal-code"
									required
								>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col">
							<div class="form-group">
								<label
									class="form-label"
									for="billing_state"
								> {{ __('State') }}</label>
								<input
									id="billing_state"
									v-model="attrs.state"
									type="text"
									name="state"
									class="form-control"
									autocomplete="address-level1"
								>
							</div>
						</div>
						<div class="col">
							<div class="form-group">
								<label
									class="form-label"
									for="billing_city"
								> {{ __('City') }} <sup>*</sup></label>
								<input
									id="billing_city"
									v-model="attrs.city"
									type="text"
									name="city"
									class="form-control"
									required="true"
									autocomplete="address-level2"
								>
							</div>
						</div>
						<div class="form-group">
							<label
								class="form-label"
								for="billing_address"
							> {{ __('Address') }} <sup>*</sup></label>
							<textarea
								id="billing_address"
								v-model="attrs.address"
								type="text"
								name="address"
								class="form-control"
								required="true"
								autocomplete="street-address"
							/>
						</div>
					</div>
					<div class="text-end">
						<button
							v-if="data.subscribeMode == 'subscribe'"
							type="submit"
							class="btn btn-primary btn-lg"
						>
							<i
								class="fa fa-credit-card-alt"
								aria-hidden="true"
							/> {{ __('Subscribe') }}
						</button>
						<button
							v-if="data.subscribeMode == 'updateBilling'"
							type="submit"
							class="btn btn-secondary btn-lg"
						>
							<i
								class="fa fa-floppy-o"
								aria-hidden="true"
							/> {{ __('Update Billing Information') }}
						</button>
					</div>
				</form>
			</div>
		</div>
		<div class="mb-3">
			<p class="text-muted">
				{{ __('Instance ID: %s', [data.instance.instance_id]) }}
			</p>
			<h5 class="mb-3">{{ __('Consumed Resources:') }}</h5>
			<p class="mb-0">{{ __('Disk Space: %s', [data.consumedSpace.s3]) }}</p>
			<p class="mb-0">{{ __('Database Size: %s', [data.consumedSpace.db]) }}</p>
			<p class="mb-0">{{ __('API Requests: N/A') }}</p>
		</div>
		<p class="small text-muted">
			{{__('There might be a delay in the Resource consumption calculations')}}
		</p>
	</div>
</template>
<script>

export default {
	props: ['data'],

	data() {
		return {
			attrs: this.data.attrs,
			allowUnsubscribe: this.data.allowUnsubscribe
		};
	},

	// mounted() {
	// 	console.log('mounted:', this.data.subscribeMode, this.data.subscribeMode, this.data.instance.paid_till, this.data.instance.instance_id);
	// },

	methods: {
		save() {
			// console.log('attrs:', JSON.parse(JSON.stringify(this.attrs)));
			this.$form(this.$refs.formEl).submit(['system/sellios/account/subscribe'])
				.then((data) => {
					if (!data.quickPayUrl) {
						alert('Error - no redirect link!');
						return;
					}

					window.location = data.quickPayUrl;
				});
		},

		cancelSubscription() {
			if (!confirm(this.__('Are you sure to cancel subscription?'))) {
				return;
			}

			this.$ajax.post(['system/sellios/account/unsubscribe'])
				.then(() => {
					this.allowUnsubscribe = false;
				});
		}
	}
};
</script>