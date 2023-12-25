<template>
	<form @submit.prevent="submit">
		<Stock
			:locations="form.locations"
			:stock-values="form.stockValues"
			:show-diff="false"
			:show-totals="false"
		/>
		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/> {{ __('Save') }}
			</button>
		</div>
	</form>
</template>
<script>
import Stock from '../ProductForm/ProductTab/StockAndPrice/Stock.vue';
import {mapMutations} from 'vuex';
import $ from 'jquery';

export default {
	components: {
		Stock
	},

	props: ['form'],

	data() {
		return {};
	},

	mounted() {
		$(this.$el).closest('#modal').one('shown.bs.modal', function () {
			$(this).find('input.form-control').get(0).focus();
		});
	},

	methods: {
		submit() {
			this.$form(this.$el).submit(['catalog/admin/product/variant/multi/setQty', {pk: this.form.pk}])
				.then(() => this.upVariantsUpdated());
		},

		...mapMutations([
			'upVariantsUpdated'
		])
	}
};
</script>