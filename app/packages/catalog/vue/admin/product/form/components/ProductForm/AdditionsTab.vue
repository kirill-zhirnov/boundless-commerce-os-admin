<template>
	<div v-if="loaded"
			 class="additions-tab"
	>
		<CrossSell :forms="forms"></CrossSell>
<!--		<Yml :form="tabForms.yml"></Yml>-->
	</div>
</template>
<script>
// import Yml from './AdditionsTab/Yml.vue';
import CrossSell from './AdditionsTab/CrossSell.vue';

import {mapState} from 'vuex';

export default {
	props: ['forms'],

	data() {
		return {
			loaded: false,
			tabForms: {}
		};
	},

	methods: {
		load() {
			this.$ajax.get(['catalog/admin/product/additions/tab'], {
				pk: this.forms.product.pk
			})
				.then((result) => {
					this.tabForms = result.forms;
					this.loaded = true;
				});
		}
	},

	computed: {
		...mapState([
			'tab'
		])
	},

	watch: {
		tab() {
			if (this.loaded || this.tab != 'additions')
				return;

			this.load();
		}
	},

	components: {
		// Yml,
		CrossSell
	}
};
</script>
