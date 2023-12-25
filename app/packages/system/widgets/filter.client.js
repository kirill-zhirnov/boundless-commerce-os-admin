import _ from 'underscore';
// import {clientRegistry} from '../../../modules/registry/client/client.client';
import MyBackboneView from '../../../modules/backbone/my/view.client';

// const i18n = clientRegistry.getI18n();

export default class Filter extends MyBackboneView {
	// constructor(options) {
		// super(options);

		// _.extend(this, _.pick(options, ['$filterToggle']));

		// if (!this.$filterToggle) {
		// 	this.$filterToggle = this.$el.siblings('.filter-toggle');
		// }
		//
		// this.listenTo$(this.$filterToggle, 'click', this.onFilterToggleClicked);
	// }

	events() {
		return {
			'submit': 'onSubmit',
			'change :input': 'onChange'
		};
	}

	// onFilterToggleClicked(e) {
	// 	console.log('onFilterToggleClicked e:', e);
	// 	let text;
	// 	e.preventDefault();
	//
	// 	if (this.$el.is(':visible')) {
	// 		text = i18n.__('Show filters');
	// 		this.$el.css({display: ''});
	// 	} else {
	// 		text = i18n.__('Hide filters');
	// 		this.$el.css({display: 'block'});
	// 	}
	//
	// 	return this.$filterToggle.find('span:not(.glyphicon)').text(text);
	// }

	onChange(e) {
		return this.fetch();
	}

	onSubmit(e) {
		return e.preventDefault();
	}

	fetch() {
		if (this.collection) {
			this.collection.trigger('filter:beforeFetch');

			return this.collection.fetch({
				reset: true,
				data: this.getFormParams()
			})
			.then(() => {
				this.collection.trigger('filter:afterFetch');

			});
		}
	}

	getFormParams() {
		//@ts-ignore
		return this.$el.serializeObject();
	}

	// remove() {
	// 	this.$filterToggle = null;
	// 	return super.remove();
	// }
}