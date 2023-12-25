<template>
	<div>
		<div
			v-for="row in options"
			:key="row.id"
			class="checkbox form-check mt-0"
		>
			<label class="form-check-label">
				<input
					:id="`attr-${attribute.attr_id}`"
					v-model="inputVal"
					class="form-check-input"
					type="checkbox"
					:name="`values[${attribute.key}][]`"
					:value="row.id"
					checked="checked"
				>
				{{ row.title }}
			</label>
		</div>
	</div>
</template>

<script>
import {mapMutations} from 'vuex';

export default {
	props: ['attribute', 'check'],
	data() {
		return {
			options: this.attribute.options ? [...this.attribute.options] : []
		};
	},
	computed: {
		inputVal: {
			get() {
				return this.check
					? Array.isArray(this.check)
						? this.check
						: [this.check]
					: [];
			},
			set(val) {
				this.formChanged();
				this.$emit('update:check', val);
			}
		}
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
			for (const element of this.inputVal) {
				if (!outIds.includes(element)) {
					out.push({
						id: element,
						title: element
					});
				}
			}
			this.options = out;
		}
	}
};
</script>