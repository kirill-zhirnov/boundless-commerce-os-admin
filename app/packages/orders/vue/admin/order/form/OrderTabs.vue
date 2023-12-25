<template>
	<ul class="tabs list-unstyled">
		<div class="tabs-content">
			<li :class="getTabClasses('main')">
				<a
					href="#"
					@click.prevent="tabClicked('main')"
				>{{ p__('order', 'Main') }}</a>
			</li>
			<li :class="getTabClasses('attributes')">
				<a
					href="#"
					@click.prevent="tabClicked('attributes')"
				>{{ p__('order', 'Attributes') }}</a>
			</li>
			<li :class="getTabClasses('additions')">
				<a
					href="#"
					@click.prevent="tabClicked('additions')"
				>{{ __('Additions') }}</a>
			</li>
		</div>
	</ul>
</template>
<script>
import {mapState} from 'vuex';

export default {

	props: ['forms', 'grid'],

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
			const classes = [];
			if (this.tab == tab)
				classes.push('active');

			if (this.tabWithErr.indexOf(tab) != -1)
				classes.push('error');

			return classes;
		},
	},
};

</script>