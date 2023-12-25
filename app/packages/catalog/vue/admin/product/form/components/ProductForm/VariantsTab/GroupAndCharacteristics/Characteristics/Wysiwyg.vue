<template>
	<textarea
		ref="editor"
		:value="value"
		:name="name"
		rows="3"
		:class="classes"
		@input="onInput($event)"
	/>
</template>
<script>
import $ from 'jquery';

export default {
	props: ['name', 'classes', 'value'],
	mounted() {
		$(this.$refs.editor).wysiwyg();
	},

	methods: {
		onInput(e) {
			// console.log(e, e.target, e.target.value)
			this.$emit('input', String(e.target.value));
		}
	},
	beforeDestroy() {
		$(this.$refs.editor).wysiwyg('rm');
	},
};
</script>