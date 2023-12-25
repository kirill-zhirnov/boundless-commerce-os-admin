<template>
	<div class="set-prices">
		<div
			v-for="price in prices"
			:key="price.price_id"
			class="form-group"
			:class="(price.has_old_price) ? 'has-old' : ''"
		>
			<label class="form-label">
				{{ price.title }}
				<span
					v-if="price.has_old_price"
					class="old"
				>
					{{ ' / ' }}
					{{ __('Compare-at price') }}
				</span>
			</label>

			<div class="input-group flex-nowrap">
				<span class="input-group-text"> {{ getLocale().getCurrencySymbol() }} </span>
				<input
					v-model="priceValues[price.price_id].value"
					type="text"
					v-bind="getPriceInputAttrs(price, false)"
				>
				<input
					v-if="price.has_old_price"
					v-model="priceValues[price.price_id].old"
					type="text"
					v-bind="getPriceInputAttrs(price, true)"
				>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	props: {
		prices: {
			default: []
		},

		values: {
			default: []
		},

		placeholder: {
			default: '0'
		}
	},

	data() {
		return {
			priceValues: this.values
		};
	},

	methods: {
		getPriceInputAttrs(price, isOld) {
			let out = {
				type: 'number',
				class: 'form-control',
				lang: 'en',
				step: '0.01',
				min: 0,
				placeholder: this.placeholder
			};


			let name = `price[p-${price.price_id}]`;

			if (isOld) {
				name = `price[p-${price.price_id}_old]`;
				out.class += ' old';
			}

			out.name = name;

			return out;
		}
	}
};
</script>