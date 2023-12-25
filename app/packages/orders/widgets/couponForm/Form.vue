<template>
	<div>
		<div class="form-group">
			<label
				class="form-label"
				for="campaign_title"
			> {{ __('Campaign title') }} </label>
			<input
				id="campaign_title"
				v-model="ownAttrs.title"
				type="text"
				name="title"
				class="form-control"
				:placeholder="__('Promocodes for Black friday')"
				required
			>
		</div>
		<div class="form-group promo-codes-group">
			<div v-show="!showGenerate">
				<label
					class="form-label"
					for="campaign_codes"
				> {{ p__('discount', 'Codes') }} </label>
				<textarea
					id="campaign_codes"
					v-model="ownAttrs.codes"
					name="codes"
					class="form-control"
					rows="6"
					required
				/>
				<p class="form-text">
					{{ __('One promo code per line') }}
				</p>
				<a
					href="#"
					@click.prevent="showGenerate = true"
				>{{ __('Generate promo codes') }}</a>
			</div>
			<div
				v-show="showGenerate"
				class="well well-sm"
			>
				<div class="tinted-box">
					<div class="form-group row">
						<label
							for="amount_of_promocodes"
							class="col-sm-5 control-label form-label"
						>
							{{ __('Number of promocodes:') }}
						</label>
						<div class="col-sm-3">
							<input
								id="amount_of_promocodes"
								v-model="amountOfPromoCodes"
								type="number"
								class="form-control"
								@keydown.13.prevent="generateCodes"
							>
						</div>
					</div>
					<div class="row">
						<div class="offset-sm-5 col-sm-5">
							<a
								href="#"
								class="btn btn-outline-secondary btn-sm"
								@click.prevent="generateCodes"
							>
								{{ __('Generate promo codes') }}
							</a>
							<a
								href="#"
								class="small"
								@click.prevent="showGenerate = false"
							>{{ __('Cancel') }}</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-sm-6">
				<div class="form-group">
					<label
						class="form-label"
						for="discount_type"
					> {{ __('Discount type') }} </label>
					<select
						id="discount_type"
						v-model="ownAttrs.discount_type"
						name="discount_type"
						class="form-select"
					>
						<option
							v-for="row in options.type"
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
						for="discount_value"
					> {{ __('Discount') }} </label>
					<div class="input-group">
						<input
							id="discount_value"
							v-model="ownAttrs.discount_value"
							type="text"
							name="discount_value"
							class="form-control"
							required
						>
						<div class="input-group-text">
							<template v-if="ownAttrs.discount_type == 'percent'">
								%
							</template>
							<template v-else-if="ownAttrs.discount_type == 'fixed'">
								{{ getLocale().getCurrencySymbol() }}
							</template>
						</div>
					</div>
				</div>
			</div>
		</div>
		<h4>{{ __('Usage limits') }}</h4>
		<hr>
		<div class="row">
			<div class="col-sm-6">
				<div class="form-group">
					<div
						v-for="row in options.limitUsageType"
						:key="row[0]"
						class="radio form-check"
					>
						<label class="form-check-label">
							<input
								v-model="ownAttrs.limit_type_usage"
								class="form-check-input"
								type="radio"
								name="limit_type_usage"
								:value="row[0]"
							> {{ row[1] }}
						</label>
					</div>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							v-model="ownAttrs.single_per_customer"
							class="form-check-input"
							type="checkbox"
							name="single_per_customer"
							value="1"
						>
						{{ __('Limit to one use per customer') }}
					</label>
				</div>
			</div>
		</div>
		<br>
		<h4>{{ __('Applies for orders, if:') }}</h4>
		<hr>
		<div class="row">
			<div class="col-sm-6">
				<div class="form-group">
					<label
						class="form-label"
						for="min_order_amount"
					> {{ __('Minimal order amount') }} </label>
					<div class="input-group">
						<input
							id="min_order_amount"
							v-model="ownAttrs.min_order_amount"
							type="text"
							name="min_order_amount"
							class="form-control"
							placeholder="0"
						>
						<div class="input-group-text">
							{{ getLocale().getCurrencySymbol() }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ['attrs', 'options'],
	data() {
		return {
			ownAttrs: this.attrs,
			amountOfPromoCodes: 10,
			showGenerate: false
		};
	},

	methods: {
		generateCodes() {
			this.$ajax.post(['orders/admin/discount/codes/makeCodes'], {
				amount: this.amountOfPromoCodes
			})
				.then((response) => {
					if (response.result) {
						if (this.ownAttrs.codes) {
							this.ownAttrs.codes += '\n';
						} else {
							this.ownAttrs.codes = '';
						}

						this.ownAttrs.codes += response.codes.join('\n');
						this.showGenerate = false;
					}
				});
		}
	}
};
</script>