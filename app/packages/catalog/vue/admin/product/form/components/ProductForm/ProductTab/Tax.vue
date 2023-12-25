<template>
	<form
		name="tax"
		@submit.prevent="$emit('submit')"
		class="tinted-box mb-5"
	>
		<div class="row">
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label">{{ __('Tax Status') }}</label>
					<div>
						<div v-for="row in form.options.status"
								 :key="row[0]"
								 class="form-check form-check-inline"
						>
							<input class="form-check-input"
										 type="radio"
										 name="tax_status"
										 :id="`tax_status_${row[0]}`"
										 v-model="attrs.tax_status"
										 :value="row[0]"
							>
							<label class="form-check-label" :for="`tax_status_${row[0]}`">
								{{ row[1] }}
							</label>
						</div>
					</div>
				</div>
			</div>
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label" for="tax_class_id">{{ __('Tax Class') }}</label>
					<select class="form-select"
									name="tax_class_id"
									id="tax_class_id"
									v-model="attrs.tax_class_id"
					>
						<option v-for="row in form.options.taxClass"
										:key="row[0]"
										:value="row[0]"
						>
							{{row[1]}}
						</option>
					</select>
				</div>
			</div>
		</div>
	</form>
</template>
<script>
export default {
	props: {
		form: {
			type: Object,
			default: function () {
				return {};
			}
		}
	},

	data() {
		return {
			attrs: this.form.attrs
		};
	},

	mounted() {
		console.log('attrs:', this.$clear(this.attrs));
	}
};
</script>