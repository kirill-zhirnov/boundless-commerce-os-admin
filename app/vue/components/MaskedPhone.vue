<template>
	<div :class="groupClassName">
		<label class="form-label"> {{ label }} </label>
		<input
			ref="maskedPhone"
			:class="inputClassName"
			:name="name"
			data-masked=""
			:placeholder="getLocale().phone.placeholder"
			:value="localValue"
			@input="$emit('input', $event.target.value)"
		>
	</div>
</template>

<script>
import $ from 'jquery';

export default {
	props: {
		value: {
			required: true
		},
		groupClassName: {
			type: String,
			default: () => 'form-group'
		},
		inputClassName: {
			default: () => 'form-control'
		},
		label: {
			default: function() {
				return this.__('Phone:');
			}
		},
		name: {
			default: () => 'phone'
		}
	},
	data() {
		return {
			localValue: this.value,
			inited: false
		};
	},
	mounted() {
		this.$bundle('clientUI').then(() => {
			$(this.$refs.maskedPhone).maskPhone();
			this.inited = true;
		});
	},
	beforeDestroy() {
		if (this.inited) {
			$(this.$refs.maskedPhone).unmask();
		}
	}
};
</script>