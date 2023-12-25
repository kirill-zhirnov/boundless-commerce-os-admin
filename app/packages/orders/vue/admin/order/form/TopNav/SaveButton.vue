<template>
	<button
		type="button"
		class="btn"
		:class="hasUnsavedData ? 'btn-primary' : 'btn-primary'"
		:disabled="isDisabled"
		@click.prevent="submit"
	>
		<template v-if="order.publishing_status === 'draft'">
			<i
				class="fa fa-floppy-o"
				aria-hidden="true"
			/>
			{{ __('Create an order') }}
		</template>
		<template v-else-if="hasUnsavedData">
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
			'loading',
			'order'
		]),
		isDisabled() {
			return !(this.hasUnsavedData || this.order.publishing_status === 'draft') || this.loading;
		}
	},
	methods: {
		...mapMutations([
			'submit'
		])
	}
};
</script>