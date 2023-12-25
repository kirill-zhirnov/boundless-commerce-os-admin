<template>
	<button type="button"
					class="btn"
					:class="isSaved ? 'btn-success' : 'btn-primary'"
					@click.prevent="$store.commit('submit')"
	>
		<template v-if="isSaved">
			<i class="fa fa-check" aria-hidden="true"></i>
			{{ __('Saved') }}
		</template>
		<template v-else>
			<i class="fa fa-floppy-o" aria-hidden="true"></i>
			{{ __('Save') }}
		</template>
	</button>
</template>
<script>
import {mapState} from 'vuex';

export default {
	data() {
		return {
			isSaved: false
		};
	},

	watch: {
		isSaved(val) {
			if (val) {
				setTimeout(() => {
					this.isSaved = false;
				}, 3000);
			}
		},

		onSuccess() {
			this.isSaved = true;
		},

		submit() {
			this.isSaved = false;
		},

		loading(val) {
			$(this.$el).prop('disabled', val);
		}
	},

	computed: {
		...mapState([
			'submit',
			'onSuccess',
			'loading'
		])
	}
};
</script>