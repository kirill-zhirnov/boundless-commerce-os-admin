<template>
	<div />
</template>
<script>
export default {
	props: ['path', 'params'],

	data() {
		return {};
	},

	mounted() {
		this.instance = this.$widget(this.$el, this.path, this.params);
	},

	beforeDestroy() {
		this.instance.remove();
	}
};
</script>