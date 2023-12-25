import Widget from '../../../modules/widget/widget.client';
import AdminMenuBaker, {TMenuType} from '../modules/adminMenuBaker';
import $ from 'jquery';
import {
	disableBodyScroll,
	enableBodyScroll,
	clearAllBodyScrollLocks
} from 'body-scroll-lock';

import SwipersDetector from '../modules/swipersDetector';

const hamburgerIsShown = 'hamburger-is-shown';
const tpl = 'hamburgerMenu';
const isOpened = 'is-opened';

export default class HamburgerMenu extends Widget {
	constructor(options) {
		super(options);

		this.tagName = 'aside';
	}

	attributes() {
		return {
			class: 'left-sidebar hamburger-menu'
		};
	}

	run() {
		return this.render(tpl, this.getTplData());
	}

	runLazyInit() {
		this.listenTo$('body', 'show.hamburger', () => this.show());
		this.listenTo$('body', 'beforeHtmlProcess.cNav', (e, response) => {
			const layoutData = response.getLayout().data;
			this.data.currentMenuUrl = layoutData.currentMenuUrl || '';

			this.hideIfShown();
			clearAllBodyScrollLocks();

			this.renderToWrapper(tpl, this.getTplData());
		});
		this.listenTo$('body', 'keydown', (e) => {
			if (e.keyCode != 27) {
				return;
			}

			this.hideIfShown();
		});
		this.listenTo$(document, 'show.bs.modal', () => this.hideIfShown());
		this.listenTo$(document, 'beforeRequest.cNav', () => this.hideIfShown());
		this.listenTo$(window, 'resize', () => this.hideIfShown());

		this.listenTo$(document, 'swiped', evt => {
			if (evt.detail.direction === 'left') {
				this.hideIfShown();
			}
		});
	}

	events() {
		return {
			'click .hamburger-menu__hide-btn a': (e) => {
				e.preventDefault();
				this.hide();
			},
			'click .hamburger-menu__overlay': (e) => {
				if ($(e.target).hasClass('hamburger-menu__overlay')) {
					this.hideIfShown();
				}
			},
			'click .menu-work__item_dropdown > a': (e) => {
				e.preventDefault();

				$(e.currentTarget)
					.parents('.menu-work__item')
					.toggleClass(isOpened);
			}
		};
	}

	show() {
		// $('body').trigger('beforeShow.hamburger');

		this.swipersDetector = new SwipersDetector(document, {minDiff: 60});
		this.swipersDetector.addEvents();

		$('body').addClass(hamburgerIsShown);
		disableBodyScroll(this.$el.get(0));
	}

	hide() {
		if (this.swipersDetector) {
			this.swipersDetector.removeEvents();
			delete this.swipersDetector;
		}

		$('body').removeClass(hamburgerIsShown);
		enableBodyScroll(this.$el.get(0));
	}

	hideIfShown() {
		if (this.isShown()) {
			this.hide();
		}
	}

	isShown() {
		return $('body').hasClass(hamburgerIsShown);
	}

	getTplData() {
		const roles = this.getView().getGlobalViewData('user').roles;

		const menuBaker = new AdminMenuBaker(this.getI18n(), this.getRouter(), roles);
		menuBaker.setCurrentMenuUrl(this.data.currentMenuUrl);

		const generalMenu = menuBaker.makeMenu(TMenuType.main);
		const settingsMenu = menuBaker.makeMenu(TMenuType.settings);

		return {
			generalMenu,
			settingsMenu
		};
	}

	remove() {
		clearAllBodyScrollLocks();
		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}