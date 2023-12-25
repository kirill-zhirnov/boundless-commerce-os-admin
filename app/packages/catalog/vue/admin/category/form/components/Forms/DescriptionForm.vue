<template>
	<form
		name="description"
		@submit.prevent="$emit('submit')"
	>
		<div class="form-group">
			<label class="form-label">{{ __('Description') }}</label>
			<textarea
				ref="descTop"
				v-model="attrs.description_top"
				name="description_top"
				rows="3"
				class="form-control"
			/>
		</div>
		<p class="small">
			<a
				href="#"
				@click.prevent="showBottomDesc = !showBottomDesc"
			>
				<i
					class="fa"
					:class="(showBottomDesc) ? 'fa-caret-down' : 'fa-caret-right'"
				/> {{ __('Additional description') }}
			</a>
		</p>
		<transition enter-active-class="animated fadeIn">
			<div
				v-show="showBottomDesc"
				class="form-group"
			>
				<label class="form-label">{{ __('Description under products') }}</label>
				<textarea
					ref="descBottom"
					v-model="attrs.description_bottom"
					name="description_bottom"
					rows="3"
					class="form-control"
				/>
			</div>
		</transition>
	</form>
</template>

<script>
import {mapMutations} from 'vuex';
import $ from 'jquery';

export default {
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs,
			showBottomDesc: false
		};
	},

	watch: {
		attrs: {
			handler: function() {
				this.setSaved(false);
			},
			deep: true
		}
	},

	beforeMount() {
		if (this.attrs.description_bottom) {
			this.showBottomDesc = true;
		}
	},

	beforeDestroy() {
		$(this.$refs.descTop).add(this.$refs.descBottom).wysiwyg('rm');
	},

	mounted() {
		$(this.$refs.descTop).add(this.$refs.descBottom)
			.wysiwyg()
			.on('changed.editor', () => this.setSaved(false))
		;
	},

	methods: {
		...mapMutations([
			'setSaved',
		])
	},
};
</script>