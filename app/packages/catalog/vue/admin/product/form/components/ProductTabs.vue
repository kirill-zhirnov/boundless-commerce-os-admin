<template>
	<ul class="tabs list-unstyled">
		<div class="tabs-content">
			<li :class="getTabClasses('product')">
				<a
					href="#"
					@click.prevent="tabClicked('product')"
				>{{ p__('product', 'General') }}</a>
			</li>
			<li :class="getTabClasses('variants')">
				<a
					href="#"
					@click.prevent="tabClicked('variants')"
				>{{ __('Variants and options') }}</a>
			</li>
			<li :class="getTabClasses('additions')">
				<a
					href="#"
					@click.prevent="tabClicked('additions')"
				>{{ __('Additionally') }}</a>
			</li>
		</div>
	</ul>
</template>
<script>
import {mapState} from 'vuex';

export default {
	computed: {
		...mapState([
			'tab',
			'tabWithErr',
		])
	},

	methods: {
		tabClicked(tab) {
			this.$store.commit('tab', tab);
		},

		getTabClasses(tab) {
			let classes = [];
			if (this.tab == tab)
				classes.push('active');

			if (this.tabWithErr.indexOf(tab) != -1)
				classes.push('error');

			return classes;
		}
	},
};
</script>