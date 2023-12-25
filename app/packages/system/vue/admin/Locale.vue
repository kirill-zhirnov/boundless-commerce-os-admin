<template>
	<form @submit.prevent="save">
		<div class="row">
			<div class="col-sm-6 offset-sm-1">
				<div class="row">
					<div class="col-sm-8">
						<div class="form-group">
							<label
								class="form-label"
								for="currency_alias"
							> {{ __('Currency') }} </label>
							<select
								id="currency_alias"
								v-model="attrs.currency_alias"
								class="form-select"
								name="currency_alias"
							>
								<option
									v-for="row in form.options.currency"
									:key="row[0]"
									:value="row[0]"
								>
									{{ row[1] }}
								</option>
							</select>
						</div>
					</div>
					<div class="col-sm-4">
						<div class="form-group">
							<label
								class="form-label"
								for="currency_symbol"
							> {{ __('Symbol') }} </label>
							<input
								id="currency_symbol"
								v-model="attrs.currency_symbol"
								type="text"
								name="currency_symbol"
								class="form-control"
								required
							>
						</div>
					</div>
				</div>
				<div class="page-header">
					<h4>{{ __('Format money settings') }}</h4>
				</div>
				<div class="row">
					<div class="col-sm-6">
						<div class="form-group">
							<label
								class="form-label"
								for="money_format"
							> {{ __('Money template') }} </label>
							<input
								id="money_format"
								v-model="attrs.money_format"
								type="text"
								name="money_format"
								class="form-control"
								required
							>
							<p class="hint small text-muted">
								%s = symbol, %v = value/number
							</p>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="form-group">
							<label
								class="form-label"
								for="money_precision"
							> {{ __('Precision') }} </label>
							<select
								id="money_precision"
								v-model="attrs.money_precision"
								class="form-select"
								name="money_precision"
							>
								<option
									v-for="row in form.options.precision"
									:key="row[0]"
									:value="row[0]"
								>
									{{ row[1] }}
								</option>
							</select>
						</div>
					</div>
				</div>
				<div class="row">
					<div class="col-sm-6">
						<div class="form-group">
							<label
								class="form-label"
								for="money_decimal"
							> {{ __('Decimal separator') }} </label>
							<select
								id="money_decimal"
								v-model="attrs.money_decimal"
								class="form-select"
								name="money_decimal"
							>
								<option
									v-for="row in form.options.separator"
									:key="row[0]"
									:value="row[0]"
								>
									{{ row[1] }}
								</option>
							</select>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="form-group">
							<label
								class="form-label"
								for="money_thousand"
							> {{ __('Thousand separator') }} </label>
							<select
								id="money_thousand"
								v-model="attrs.money_thousand"
								class="form-select"
								name="money_thousand"
							>
								<option
									v-for="row in form.options.separator"
									:key="row[0]"
									:value="row[0]"
								>
									{{ row[1] }}
								</option>
							</select>
						</div>
					</div>
				</div>
				<div class="page-header">
					<h4>{{ __('Format phone settings') }}</h4>
				</div>
				<div class="row">
					<div class="col-sm-6">
						<div class="form-group">
							<label
								class="form-label"
								for="phone_mask"
							> Mask </label>
							<input
								id="phone_mask"
								v-model="attrs.phone_mask"
								type="text"
								name="phone_mask"
								class="form-control"
								required
							>
							<p class="hint small text-muted">
								{{ __('The mask is a template for a phone number. "P" is a "+" symbol, "0" - is a number, "X" is a number, which might be skipped, template for the phone number: +1 (555) 123-4567 is "P0X (000) 000-0000"') }}
							</p>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="form-group">
							<label
								class="form-label"
								for="phone_placeholder"
							> Placeholder </label>
							<input
								id="phone_placeholder"
								v-model="attrs.phone_placeholder"
								type="text"
								name="phone_placeholder"
								class="form-control"
								required
							>
							<p class="hint small text-muted">
								{{ __('The placeholder is used as an example of valid number') }}
							</p>
						</div>
					</div>
				</div>
				<div class="text-center">
					<button
						type="submit"
						class="btn btn-primary"
					>
						<i class="fa fa-floppy-o" /> {{ __('Save') }}
					</button>
				</div>
			</div>
			<div class="col-sm-4">
				<div class="tinted-box">
					<h4>{{ __('Format example:') }}</h4>
					<p> {{ formatMoney(2.03, formatMoneyOptions) }} </p>
					<p> {{ formatMoney(123.17, formatMoneyOptions) }} </p>
					<p> {{ formatMoney(990, formatMoneyOptions) }} </p>
					<p> {{ formatMoney(100000.23, formatMoneyOptions) }} </p>
				</div>
			</div>
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

	computed: {
		formatMoneyOptions() {
			return {
				symbol: this.attrs.currency_symbol,
				format: this.attrs.money_format,
				decimal: this.attrs.money_decimal,
				thousand: this.attrs.money_thousand,
				precision: Number(this.attrs.money_precision)
			};
		}
	},

	watch: {
		'attrs.currency_alias': function(val) {
			this.attrs.currency_symbol = this.form.currencySymbols[val];
		}
	},

	methods: {
		save() {
			this.$form(this.$el).submit(['system/admin/site/locale']);
		}
	}
};
</script>