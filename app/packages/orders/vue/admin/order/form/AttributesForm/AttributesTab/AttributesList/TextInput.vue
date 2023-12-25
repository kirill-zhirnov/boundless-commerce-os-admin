<template>
	<input
		:id="`attr-${attribute.attr_id}`"
		v-model="inputVal"
		class="form-control mb-0"
		:name="`values[${attribute.key}]`"
		@input="formChanged"
	>
</template>

<script>
import {mapMutations} from 'vuex';

export default {
	props: ['attribute', 'values'],
	computed: {
		inputVal: {
			get() {
				return this.values[this.attribute.key];
			},
			set(val) {
				this.formChanged();
				this.$emit('input', val);
			}
		}
	},
	methods: {
		...mapMutations(['formChanged']),
	}
};
</script>