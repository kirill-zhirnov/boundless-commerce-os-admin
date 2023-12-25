<template>
	<form @submit.prevent="submit">
		<PriceRow
			:prices="form.prices"
			:values="form.priceValues"
			:placeholder="''"
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
import PriceRow from '../ProductForm/ProductTab/StockAndPrice/PriceRow.vue';
import {mapMutations} from 'vuex';
import $ from 'jquery';

export default {
	components: {
		PriceRow
	},

	props: ['form'],

	data() {
		return {};
	},

	mounted() {
		$(this.$el).closest('#modal').one('shown.bs.modal', function() {
			$(this).find('input.form-control').get(0).focus();
		});
	},

	methods: {
		submit() {
			this.$form(this.$el).submit(['catalog/admin/product/variant/multi/setPrice', {pk: this.form.pk}])
				.then(() => this.upVariantsUpdated());
		},

		...mapMutations([
			'upVariantsUpdated'
		])
	}
};
</script>