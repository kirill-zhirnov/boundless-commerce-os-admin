<template>
	<form
		class=""
		@submit.prevent="submit"
	>
		<div class="form-group">
			<label
				class="form-label"
				for="app-name"
			>{{ __("Application name") }} <sup>*</sup></label>
			<input
				id="app-name"
				v-model="values.name"
				name="name"
				type="text"
				class="form-control"
				required
			>
		</div>
		<div class="text-end">
			<button
				class="btn btn-primary"
				type="submit"
			>
				<span class="glyphicon glyphicon-floppy-saved" />
				{{ " " }}
				{{ __("Create") }}
			</button>
		</div>
	</form>
</template>

<script>
export default {
	props: ['submit'],

	data() {
		return {
			values: {}
		};
	},

	computed: {},

	beforeMount() {},

	methods: {}
};
</script>