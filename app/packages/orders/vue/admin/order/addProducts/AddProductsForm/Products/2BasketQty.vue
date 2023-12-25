<template>
	<div class="to-basket-qty">
		<div class="input-group input-group-sm">
			<button
				class="btn btn-outline-secondary"
				type="button"
				@click.prevent="modify(-1)"
			>
				<i
					class="fa fa-minus"
					aria-hidden="true"
				/>
			</button>

			<input
				class="form-control text-center"
				:value="value"
				type="number"
				min="0"
				:max="max"
				step="1"
				@input="onInput"
			>
			<button
				class="btn btn-outline-secondary"
				type="button"
				@click.prevent="modify(+1)"
			>
				<i
					class="fa fa-plus"
					aria-hidden="true"
				/>
			</button>
		</div>
	</div>
</template>
<script>
export default {
	props: {
		value: {
			default: () => 0
		},
		max: {
			type: Number,
			default: null
		}
	},
	methods: {
		onInput(e) {
			this.emitInput(e.target.value);
		},

		emitInput(newValue) {
			this.$emit('input', newValue);
			this.$emit('changed');
		},

		modify(adjustment) {
			let value = parseInt(this.value);
			if (isNaN(value)) {
				value = 0;
			}

			value += adjustment;

			if (value < 0)
				value = 0;

			if (this.max && !isNaN(this.max) && value > this.max) {
				value = this.max;
			}

			this.emitInput(value);
		}
	}
};
</script>