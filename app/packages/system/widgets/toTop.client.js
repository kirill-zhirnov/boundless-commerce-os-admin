import Widget from '../../../modules/widget/widget.client';
import gHtml from '../../../modules/gHtml/index.client';
import $ from 'jquery';

export default class ToTop extends Widget {
	constructor(options) {
		super(options);

		this.tagName = 'div';
	}

	attributes() {
		return {
			class: 'general-content-wrapper to-top-wrapper',
			href: '#'
		};
	}

	events() {
		return {
			click(e) {
				e.preventDefault();
				$('html, body').animate({scrollTop: 0}, 'fast');
			}
		};
	}

	run() {
		return this.wrapInWrapper(
			gHtml.tag('div', {class: 'general-content-subwrapper'}, gHtml.tag('a', {class: 'to-top'}, `${gHtml.faIcon('arrow-up')} ${this.__('Back to top')}`)),
			true
		);
	}

	runLazyInit() {
		this.checkVisibility();

		this.listenTo$(window, 'scroll', () => this.checkVisibility());
		this.listenTo$(window, 'resize', () => this.checkVisibility());
	}

	checkVisibility() {
		if ($(window).scrollTop() > 200) {
			return this.$el.css('visibility', 'visible');
		} else {
			return this.$el.css('visibility', 'hidden');
		}
	}

	getFileName() {
		return __filename;
	}
}