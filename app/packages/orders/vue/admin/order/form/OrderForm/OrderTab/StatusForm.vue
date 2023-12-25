<template>
	<form
		class="order-form__tinted-box"
		name="status"
		@submit.prevent="submit"
	>
		<div class="form-group">
			<label
				class="form-label fw-bold"
				for="order_status_id"
			>{{ __('Status') }}</label>
			<select
				id="order_status_id"
				v-model="attrs.status_id"
				name="status_id"
				class="form-select"
				@input="onInput"
			>
				<option
					v-for="row in form.options.status"
					:key="row[0]"
					:value="row[0]"
				>
					{{ row[1] }}
				</option>
			</select>
		</div>
		<div class="checkbox form-check">
			<label class="form-check-label">
				<input
					v-model="attrs.is_paid"
					class="form-check-input"
					type="checkbox"
					name="is_paid"
					value="1"
					@input="onInput"
				>
				{{ __('Order is paid') }}
			</label>
		</div>
	</form>
</template>
<script>
import {mapMutations} from 'vuex';

export default {
	props: ['form'],
	data() {
		return {
			attrs: this.form?.attrs || {},
		};
	},
	methods: {
		onInput() {
			this.formChanged();
		},

		...mapMutations(['formChanged', 'submit'])
	}
};
</script>