<template>
	<div class="well well-sm shipping-mark-up">
		<div class="form-group">
			<label class="control-label form-label"> {{ __('Shipping markup') }} </label>
			<div class="editor">
				<textarea
					ref="editor"
					name="mark_up"
					:value="inputVal"
					@input="upVal('input', $event.target.value)"
				/>
			</div>
			<p class="form-text small">
				<a
					href="#"
					@click.prevent="setCmVal('10')"
				>10</a> - {{ p__('markup', 'if you want to add a fixed markup') }}<br>
				<a
					href="#"
					@click.prevent="setCmVal('MULTIPLY(0.1, SHIPPING_COST)')"
				>MULTIPLY(0.1, SHIPPING_COST)</a> - {{ p__('markup', 'if you want to add a 10% of shipping cost') }} <br>
				<a
					href="#"
					@click.prevent="setCmVal('ADD(MULTIPLY(0.1, SHIPPING_COST), 20)')"
				>ADD(MULTIPLY(0.1, SHIPPING_COST), 20)</a> - {{ p__('markup', 'if you want to add a 10% of shipping cost plus 20') }} <br>
				<a
					href="#"
					@click.prevent="setCmVal(`BRANCH(SHIPPING_TYPE = &quot;courier&quot;, 20, 10)`)"
				>BRANCH(SHIPPING_TYPE = "courier", 20, 10)</a> - {{ p__('markup', 'if you want to add 20 for courier delivery and 10 for pickup point delivery') }}
			</p>
			<div class="text-muted small text-end">
				<a
					:href="help ? help.url : ''"
					target="_blank"
				>
					<i
						class="fa fa-question-circle"
						aria-hidden="true"
					/> {{ __('Read more in documentation.') }}
				</a>
			</div>
		</div>
	</div>
</template>
<script>

export default {
	props: ['value', 'help'],

	data() {
		return {
			inputVal: this.value,
			CodeMirror: null
		};
	},

	mounted() {
		this.$bundle('adminUI').then(() => {
			this.CodeMirror = require('codemirror');
			require('codemirror/mode/mathematica/mathematica');

			this.$nextTick(this.setupCodemirror);
		});

	},

	beforeDestroy() {
		this.cm.toTextArea();
	},

	methods: {
		upVal(value) {
			this.$emit('input', value);
			this.inputVal = value;
		},

		setCmVal(value) {
			this.cm.setValue(value);
		},
		setupCodemirror() {
			this.cm = this.CodeMirror.fromTextArea(this.$refs.editor, {
				mode: 'mathematica'
			});
			this.cm.on('change', (editor) => this.upVal(editor.getValue()));
		}
	}
};
</script>