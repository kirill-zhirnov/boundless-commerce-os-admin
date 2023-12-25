<template>
	<form
		name="category"
		@submit.prevent="$emit('submit')"
	>
		<div class="form-group">
			<label
				class="form-label"
				for="category_title"
			>
				{{ __('Category title') }} <sup>*</sup>
			</label>
			<input
				id="category_title"
				v-model="attrs.title"
				type="text"
				name="title"
				class="form-control"
				:placeholder="__('Type category title')"
				required
			>
		</div>
	</form>
</template>
<script>
import {mapMutations} from 'vuex';

export default {
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs
		};
	},

	watch: {
		attrs: {
			handler: function () {
				this.setSaved(false);
			},
			deep: true
		},

		'attrs.title': function (val) {
			this.setTitle(val);
		}
	},

	methods: {
		...mapMutations([
			'setSaved',
			'setTitle'
		])
	},
};
</script>