import Widget from '../../../modules/widget/widget.client';
import _ from 'underscore';

export default class BreadCrumbs extends Widget {
	attributes() {
		const out = {
			class: 'bread-crumb-wrap'
		};

		if (this.isBreadCrumbsEmpty()) {
			out.class += ' hidden';
		}

		return out;
	}

	run() {
		return this.render('breadCrumbs');
	}

	runLazyInit() {
		this.listenTo$('body', 'beforeHtmlProcess.cNav', function(e, response) {
			const layoutData = response.getLayout().data;
			this.data.breadCrumbs = layoutData.breadCrumbs ? layoutData.breadCrumbs : [];

			this.renderToWrapper('breadCrumbs');

			if (this.isBreadCrumbsEmpty()) {
				if (!this.$el.hasClass('hidden')) {
					return this.$el.addClass('hidden');
				}
			} else {
				return this.$el.removeClass('hidden');
			}
		});
	}


	isBreadCrumbsEmpty() {
		if (!_.isArray(this.data.breadCrumbs) || (this.data.breadCrumbs.length === 0)) {
			return true;
		}

		return false;
	}

	getFileName() {
		return __filename;
	}
}