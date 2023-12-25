<template>
	<form
		name="size"
		class="tinted-box"
		@submit.prevent="$emit('submit')"
	>
		<h4>
			<i
				class="fa fa-truck"
				aria-hidden="true"
			/> {{ __('Weight and Dimensions') }}
		</h4>
		<div class="size-row">
			<div class="form-group weight">
				<label class="form-label"> {{ __('Weight') }} </label>
				<div class="input-group">
					<input
						v-model="attrs.weight"
						type="number"
						class="form-control"
						min="0"
						lang="en"
						step="0.01"
						name="weight"
					>
					<span class="input-group-text">{{ __('kg.') }}</span>
				</div>
			</div>
			<div class="dimensions">
				<div class="form-group">
					<label class="form-label"> {{ __('Width') }} </label>
					<input
						v-model="attrs.width"
						type="number"
						class="form-control"
						min="0"
						lang="en"
						step="0.01"
						name="width"
					>
				</div>
				<b>X</b>
				<div class="form-group">
					<label class="form-label"> {{ __('Height') }} </label>
					<input
						v-model="attrs.height"
						type="number"
						class="form-control"
						min="0"
						lang="en"
						step="0.01"
						name="height"
					>
				</div>
				<b>X</b>
				<div class="form-group">
					<label class="form-label"> {{ __('Length') }} </label>
					<div class="input-group">
						<input
							v-model="attrs.length"
							type="number"
							class="form-control"
							min="0"
							lang="en"
							step="0.01"
							name="length"
						>
						<span class="input-group-text">{{ __('cm.') }}</span>
					</div>
				</div>
			</div>
		</div>
		<button
			type="submit"
			class="d-none"
		/>
	</form>
</template>
<script>
export default {
	props: ['form'],

	data() {
		return {
			attrs: {}
		};
	},

	beforeMount() {
		this.attrs = this.form.attrs;
	}
};
</script>