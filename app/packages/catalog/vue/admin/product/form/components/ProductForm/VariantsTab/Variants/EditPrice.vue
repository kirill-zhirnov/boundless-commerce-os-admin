<template>
	<div class="form-group">
		<div class="input-group input-group-sm">
			<input v-bind="getPriceInputAttrs('price', false)"
				   v-model="price"
				   ref="price"
				   @keydown.13.prevent="save"
			>
			<input v-bind="getPriceInputAttrs('old', true)"
				   v-model="priceOld"
				   @keydown.13.prevent="save"
			>
		</div>
	</div>
</template>
<script>
	export default {
		props: ['variant'],

		data() {
			return {
				price: this.variant.price,
				priceOld: this.variant.price_old
			}
		},

		mounted() {
			$(document).on('keydown.inline', (e) => {
				if (e.keyCode == 27) {
					this.$emit('exit');
				}
			});

			setTimeout(() => {
				this.$refs.price.focus();
			}, 100);
		},

		methods: {
			getPriceInputAttrs(name, isOld) {
				let out = {
					name: name,
					type: "number",
					class: "form-control",
					lang: "en",
					step: "0.01",
					min: 0,
					placeholder: '0',
				};

				if (isOld)
					out.class += ' old';

				return out;
			},

			save() {
				this.$form(this.$el).submit(['catalog/admin/product/variant/setPrice', {pk: this.variant.variant_id}])
					.then((res) => this.$emit('saved', res.prices));
			}
		},

		beforeDestroy() {
			$(document).off('keydown.inline');
		}
	}
</script>