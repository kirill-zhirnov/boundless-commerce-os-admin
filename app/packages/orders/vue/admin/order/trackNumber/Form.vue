<template>
	<form @submit.prevent="submit">
		<div class="form-group">
			<label
				class="form-label"
				for="track_number"
			>{{ __("Tracking number:") }}</label>
			<input
				id="track_number"
				v-model="form.track_number"
				class="form-control"
				name="track_number"
			>
		</div>
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
import {mapActions, mapState} from 'vuex';

export default {
	props: ['attrs', 'pk'],
	data() {
		return {
			form: this.attrs || {}
		};
	},
	computed: {
		...mapState(['order']),
	},
	methods: {
		...mapActions(['getTrackingNumbers']),
		async submit() {
			const res = await this.$form(this.$el).submit(['orders/admin/order/tracking/form', {order: this.order.order_id, pk: this.pk}]);
			if (res) {
				await this.getTrackingNumbers();
			}
		},
	}
};
</script>