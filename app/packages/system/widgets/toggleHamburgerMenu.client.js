import Widget from '../../../modules/widget/widget.client';
import gHtml from '../../../modules/gHtml/index.client';
import $ from 'jquery';

export default class ToggleHamburgerMenuClient extends Widget {
	constructor(options) {
		super(options);

		this.tagName = 'a';
	}

	attributes() {
		return {
			href: '#',
			class: 'btn custom-btn custom-btn_icon-square d-flex d-xl-none'
		};
	}

	run() {
		return this.wrapInWrapper(gHtml.tag('span', {
			class: 'ico ico_size_20 ico_menu'
		}));
	}

	events() {
		return {
			'click': (e) => {
				e.preventDefault();

				$('body').trigger('show.hamburger');
			}
		};
	}

	getFileName() {
		return __filename;
	}
}