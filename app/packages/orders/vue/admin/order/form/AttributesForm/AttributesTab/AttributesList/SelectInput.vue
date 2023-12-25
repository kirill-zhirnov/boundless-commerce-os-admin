<template>
	<select
		v-model="inputVal"
		class="form-select"
		:name="`values[${attribute.key}]`"
	>
		<option value="" />
		<option
			v-for="option in options"
			:key="option.id"
			:value="option.id"
		>
			{{ option.title }}
		</option>
	</select>
</template>

<script>
import {mapMutations} from 'vuex';

export default {
	props: ['attribute', 'select'],
	data() {
		return {
			options: this.attribute.options ? [...this.attribute.options] : []
		};
	},
	computed: {
		inputVal: {
			get() {
				return this.select || '';
			},
			set(val) {
				this.formChanged();
				this.$emit('update:select', val);
			}
		},
	},
	watch: {
		'attribute.options'() {
			this.calcOptions();
		}
	},
	mounted() {
		this.calcOptions();
	},
	methods: {
		...mapMutations(['formChanged']),
		calcOptions() {
			const out = this.attribute.options ? [...this.attribute.options] : [];
			const outIds = out.map(el => el.id);
			if (this.inputVal && !outIds.includes(this.inputVal)) {
				out.push({
					id: this.inputVal,
					title: this.inputVal
				});
			}
			this.options = out;
		}
	}
};
</script>