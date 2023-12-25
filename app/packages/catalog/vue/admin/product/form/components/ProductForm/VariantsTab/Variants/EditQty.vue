<template>
	<div class="qty-wrapper">
		<div class="set-qty">
			<div
				v-for="location in locations"
				:key="location.location_id"
				class="form-group"
			>
				<label class="form-label">
					{{ location.title }}
				</label>
				<input
					v-model="stockValues[location.location_id].available_qty"
					type="number"
					class="form-control form-control-sm"
					min="0"
					:name="`qty[l-${location.location_id}]`"
					@keydown.13.prevent="save"
				>
			</div>
		</div>
	</div>
</template>
<script>
import $ from 'jquery';

export default {
	props: ['variant'],

	data() {
		return {
			locations: [],
			stockValues: {}
		};
	},

	beforeMount() {
		this.aUrl = ['catalog/admin/product/variant/setQty', {pk: this.variant.variant_id}];

		this.$ajax.get(this.aUrl)
			.then((data) => {
				this.locations = data.locations;
				this.stockValues = data.stockValues;

				setTimeout(() => {
					$(this.$el).find('input').get(0).focus();
				}, 100);
			});

		$(document).on('keydown.inline', (e) => {
			if (e.keyCode == 27) {
				this.$emit('exit');
			}
		});
	},

	beforeDestroy() {
		$(document).off('keydown.inline');
	},

	methods: {
		save() {
			this.$form(this.$el).submit(this.aUrl)
				.then((res) => this.$emit('saved', res.stock));
		}
	}
};
</script>