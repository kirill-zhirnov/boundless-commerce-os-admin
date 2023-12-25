<template>
	<button
		type="button"
		class="btn"
		:class="hasUnsavedData ? 'btn-primary' : 'btn-primary'"
		:disabled="!hasUnsavedData || loading"
		@click.prevent="submit"
	>
		<template v-if="hasUnsavedData">
			<i
				class="fa fa-floppy-o"
				aria-hidden="true"
			/>
			{{ __('Save') }}
		</template>
		<template v-else>
			<i
				class="fa fa-check"
				aria-hidden="true"
			/>
			{{ __('Saved') }}
		</template>
	</button>
</template>
<script>
import {mapState, mapMutations} from 'vuex';

export default {
	computed: {
		...mapState([
			'hasUnsavedData',
			'loading'
		])
	},
	methods: {
		...mapMutations([
			'submit'
		])
	}
};
</script>