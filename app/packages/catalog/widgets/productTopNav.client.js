import Widget from '../../../modules/widget/widget.client';
import gHtml from '../../../modules/gHtml/index.client';
import Vue from 'vue';

export default class ProductTopNav extends Widget {
	attributes() {
		return {
			class: 'product-top-nav',
			role: 'navigation',
		};
	}

	async run() {
		return this.wrapInWrapper(gHtml.tag('div', {class: 'app'}, ''), true);
	}

	runLazyInit() {
		const TopNav = require('../vue/admin/product/form/components/TopNav.vue').default;
		const store = require('../vue/admin/product/form/store/index').default;

		store.commit('reset');

		this.vues.push(
			new Vue({
				store,
				render: (h) => h(TopNav)
			}).$mount(this.$('.app').get(0))
		);
	}

	getFileName() {
		return __filename;
	}
}