//@ts-nocheck

import Widget from '../../../modules/widget/widget.client';
import $ from 'jquery';
import {createPopper} from '@popperjs/core';
import AdminMenuBaker from '../modules/adminMenuBaker';

const isShort = 'is-short-menu';
const isStickied = 'is-stickied';
const isOpened = 'is-opened';
const ddShortIsOpened = 'short-is-opened';
const short = 'short';
const animationDelay = 200;
const ddWrapper = 'menu-work-dropdown__wrapper';

export default class AdminMenu extends Widget {
	constructor(options) {
		super(options);

		this.tagName = 'aside';
		this.poppers = {};
		this.showTimer = null;
		this.hideTimer = null;
	}

	attributes() {
		const out = {
			class: 'left-sidebar admin-menu'
		};

		// if (this.getView().getGlobalViewData('leftSideBar') === short) {
		// 	out.class += ` ${isShort}`;
		// }

		return out;
	}

	run() {
		return this.render(this.getTpl(), this.getTplData());
	}

	runLazyInit() {
		this.setupListeners();
		this.checkAffix();
	}

	events() {
		return {
			'click .menu-work__item_dropdown > a': (e) => {
				e.preventDefault();

				if ($('html').hasClass(isShort)) {
					return;
				}

				$(e.currentTarget)
					.parents('.menu-work__item')
					.toggleClass(isOpened);

				setTimeout(() => this.checkAffix(), animationDelay);
			},
			'mouseenter .menu-work__item_dropdown': (e) => {
				this.cancelAllTimers();

				const $el = $(e.currentTarget);
				if ($el.hasClass(ddShortIsOpened)) {
					return;
				}

				const $curOpened = this.$(`.${ddShortIsOpened}`);
				if ($curOpened.length > 0) {
					this.showTimer = setTimeout(() => this.showDropDown($el), 100);
				} else {
					this.showDropDown($el);
				}
			},
			'mouseleave .menu-work__item_dropdown': (e) => {
				if (!$('html').hasClass(isShort)) {
					return;
				}

				this.startHideTimer($(e.currentTarget));
			}
		};
	}

	showDropDown($el) {
		if (!$('html').hasClass(isShort)) {
			return;
		}

		this.hideAllOpenedDropDowns();
		const popperIndex = `p-${$el.data('index')}`;
		if (!(popperIndex in this.poppers)) {
			const $subMenuEl = $el.find(`.${ddWrapper}`);

			this.poppers[popperIndex] = createPopper($el.get(0), $subMenuEl.get(0), {
				placement: 'right',
				modifiers: [
					{
						name: 'preventOverflow',
						options: {
							padding: {
								top: 69
							}
						},
					},
					{
						name: 'offset',
						options: {
							offset: [0, 12],
						},
					},
				]
			});
		}

		$el.addClass(ddShortIsOpened);
		this.enablePopper(this.poppers[popperIndex]);
	}

	startHideTimer($el) {
		this.cancelHideTimer();
		this.hideTimer = setTimeout(() => this.hideDropDown($el), 300);
	}

	hideDropDown($el) {
		$el.removeClass(ddShortIsOpened);
		$el.find(`.${ddWrapper}`).removeAttr('style');

		const popperIndex = `p-${$el.data('index')}`;
		if (popperIndex in this.poppers) {
			this.disablePopper(this.poppers[popperIndex]);
		}
	}

	hideAllOpenedDropDowns() {
		this.$(`.${ddShortIsOpened}`).removeClass(ddShortIsOpened);
		this.disableAllPoppers();
	}

	getTpl() {
		return 'adminMenu';
	}

	getTplData() {
		const roles = this.getView().getGlobalViewData('user').roles;

		const menuBaker = new AdminMenuBaker(this.getI18n(), this.getRouter(), roles);
		menuBaker.setCurrentMenuUrl(this.data.currentMenuUrl);

		const generalMenu = menuBaker.makeMenu('main');
		const settingsMenu = menuBaker.makeMenu('settings');

		return {
			generalMenu,
			settingsMenu
		};
	}

	checkAffix() {
		// console.log('checkAffix:', this.$el.outerHeight(), $(window).height(), $(window).height() > (this.$el.outerHeight() + 50));

		if ($(window).height() >= (this.$el.outerHeight() + 50)) {
			this.$el.addClass(isStickied);
		} else {
			this.$el.removeClass(isStickied);
		}
	}

	setupListeners() {
		this.listenTo$(window, 'resize', () => this.checkAffix());
		this.listenTo$('body', 'toggled.adminMenu', (e, leftSideBar) => {
			if (leftSideBar === short) {
				$('html').addClass(isShort);
				this.closeAllOpened();
			} else {
				$('html').removeClass(isShort);
				this.resetShortDropDowns();
			}

			this.checkAffix();
		});
		this.listenTo$('body', 'beforeHtmlProcess.cNav', (e, response) => {
			const layoutData = response.getLayout().data;
			this.data.currentMenuUrl = layoutData.currentMenuUrl || '';

			this.destroyPoppers();
			this.renderToWrapper(this.getTpl(), this.getTplData())
				.then(() => this.checkAffix());
		});
	}

	enablePopper(popperInstance) {
		popperInstance.setOptions((options) => ({
			...options,
			modifiers: [
				...options.modifiers,
				{name: 'eventListeners', enabled: true},
			],
		}));

		popperInstance.update();
	}

	disablePopper(popperInstance) {
		popperInstance.setOptions((options) => ({
			...options,
			modifiers: [
				...options.modifiers,
				{
					name: 'eventListeners',
					enabled: false
				},
			],
		}));
	}

	resetShortDropDowns() {
		this.cancelAllTimers();
		this.destroyPoppers();

		this.$(`.${ddShortIsOpened}`).removeClass(ddShortIsOpened);
		this.$(`.${ddWrapper}`).removeAttr('style');
	}

	closeAllOpened() {
		this.$(`li.${isOpened}`).removeClass(isOpened);
	}

	disableAllPoppers() {
		Object.keys(this.poppers).forEach((key) => this.disablePopper(this.poppers[key]));
	}

	destroyPoppers() {
		Object.keys(this.poppers).forEach((key) => this.poppers[key].destroy());
		this.poppers = {};
	}

	cancelShowTimer() {
		clearTimeout(this.showTimer);
	}

	cancelHideTimer() {
		clearTimeout(this.hideTimer);
	}

	cancelAllTimers() {
		this.cancelShowTimer();
		this.cancelHideTimer();
	}

	remove() {
		this.destroyPoppers();

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}
