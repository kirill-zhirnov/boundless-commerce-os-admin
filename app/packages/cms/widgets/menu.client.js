import _ from 'underscore';
import modalKit from '../../../modules/modal/kit.client';
import markCurrentMenu from '../modules/markCurrentMenu.client';
import $ from 'jquery';
import extend from 'extend';
import Widget from '../../../modules/widget/widget.client';

export default class Menu extends Widget {
	constructor(options) {
		super(options);

		this.tagName = 'nav';

		this.menuKey = null;
		this.cacheKey = null;
		this.hasHoverDD = false;
		this.hasClickDD = false;

		this.hideTimer = null;

		if (this.data.hoverDD) {
			this.setupHoverDD();
		} else if (this.data.clickDD) {
			this.setupClickDD();
		}

		_.extend(this, _.pick(options, ['menuKey']));

		this.checkMenuKey();
	}

	run() {
		return this.getMenu()
			.then(menu => {
				return this.render(this.getMenuTpl(), {
					menu
				});
			})
		;
	}

	runLazyInit() {
		this.getWCache().save(this.cacheKey, this.data.menu);
		this.setupListeners();

		return this.afterRender();
	}

	afterRender() {
		if (this.isEditMode()) {
			return this.setupBossButtons();
		}
	}

	attributes() {
		const classes = [`menu-${this.menuKey}`];

		if (this.hasClickDD) {
			classes.push('click-dd');
		}

		return {
			class: classes.join(' ')
		};
	}

	events() {
		const out = {};

		if (!this.isEditMode()) {
			if (this.hasHoverDD) {
				_.extend(out, {
					[`mouseover ${this.data.hoverDD.selectors.toggle}`]: 'onToggleOver',
					[`mouseout ${this.data.hoverDD.selectors.toggle}`]: 'onToggleOut'
				});
			}

			if (this.hasClickDD) {
				_.extend(out, {
					[`click ${this.data.clickDD.selectors.toggle}`]: 'onToggleClicked'
				});
			}
		} else {
			_.extend(out, {
				'click': () => {
					return modalKit.createRemote(this.getEditBtnUrl());
				}
			});
		}

		return _.extend(super.events(), out);
	}

	getMenuTpl() {
		if (this.data.tpl) {
			return `menu/${this.data.tpl}`;
		}

		return `menu/${this.menuKey}`;
	}

	getMenu() {
		return this.getWCache().load(this.cacheKey, () => {
			return this.makeIsomorphicRequest(['cms/navigation/menu'], {menu: this.menuKey, type: null});
		})
			.then(result => {
				this.data.menu = result;

				return markCurrentMenu.process(
					this.data.menu,
					this.getView().getGlobalViewData('currentMenuUrl')
				).menu;
			});
	}

	checkMenuKey() {
		this.menuKey = this.menuKey || this.data.key;

		if (!this.menuKey) {
			throw new Error('You must specify menu key!');
		}

		this.menuKey = this.menuKey.toLowerCase();
		return this.cacheKey = `cmsMenu-${this.menuKey}`;
	}

	setupListeners() {
		this.listenTo$('body', 'beforeHtmlProcess.cNav', function (e, response) {
			return this.reRender();
		});

		this.listenTo$('body', 'menuRefresh.widget', function (e, key, id, config) {
			if ((key === this.menuKey) || (key === 'all')) {
				if (!id || (id && (id === this.getId())) || (key === 'all')) {
//					fixme: this is a stupid dognail, since I can't execute
//					@renderAndReplace() - because this call removes edit-mode attributes.
					if (config && config.clickDD) {
						this.$el.addClass('click-dd');
					} else {
						this.$el.removeClass('click-dd');
					}
				}

				this.refresh();
			}

		});

		if (this.hasHoverDD) {
			return this.listenTo$(window, 'resize', e => {
				return this.hideOpened();
			});
		}
	}

	onToggleOver(e) {
		this.cancelHideTimer();
		const $el = $(e.currentTarget);

		this.hideOpened($el);

		if (!$el.hasClass('opened')) {
			$el.addClass('opened');

			const $sub = $el.find(this.data.hoverDD.selectors.subRelToggle);
			if ($sub.length > 0) {
				return this.setSubPosition($el, $sub);
			}
		}
	}

	onToggleOut(e) {
		return this.startHideTimer();
	}

	hideOpened($el = null) {
		const $curOpened = this.$('.opened');

		if ($el && ($el.get(0) === $curOpened.get(0))) {
			return;
		}

		return $curOpened.removeClass('opened');
	}

	startHideTimer() {
		this.cancelHideTimer();

		return this.hideTimer = setTimeout(() => {
				return this.hideOpened();
			}
			, 300);
	}

	cancelHideTimer() {
		if (this.hideTimer) {
			return clearTimeout(this.hideTimer);
		}
	}

	setupClickDD() {
		this.hasClickDD = true;

		return this.data.clickDD = extend({
			selectors: {
				toggle: '> ul > li.has-children > a',
				subRelToggle: '> ul'
			}
		}, this.data.clickDD);
	}

	setupHoverDD() {
		this.hasHoverDD = true;
		return this.data.hoverDD = extend({
			selectors: {
				toggle: '> ul > li',
				subRelToggle: '> ul'
			}
		}, this.data.hoverDD);
	}

	setSubPosition($el, $sub) {
//		reset current position:

		let left = null;
		const elPosition = $el.position();
		const subWidth = $sub.outerWidth();

		if ((elPosition.left + subWidth) > this.$el.outerWidth()) {
			left = (elPosition.left + $el.outerWidth()) - subWidth;
		} else {
			({
				left
			} = elPosition);
		}

		return $sub.css('left', left);
	}

	onToggleClicked(e) {
		e.preventDefault();
		e.stopPropagation();

		const $parent = $(e.currentTarget).closest('.has-children');
		const $ul = $parent.find('> ul');
		if ($parent.hasClass('open')) {
			if (this.data.toggleAnim === 'slide') {
				return $ul.slideUp(() => {
					return $parent.removeClass('open');
				});
			} else {
				return $parent.removeClass('open');
			}
		} else {
			if (this.data.toggleAnim === 'slide') {
				return $ul.slideDown(() => {
					return $parent.addClass('open');
				});
			} else {
				return $parent.addClass('open');
			}
		}
	}

	getBossDefaultButtons() {
		return [];
	}

	getEditBtnUrl() {
		let url = null;

		if (this.menuKey === 'category') {
			if (this.data.menu.length > 0) {
				url = this.url('theme/bosses/menu/edit', {
					theme: this.themeId,
					layout: this.getLayoutEl().data('layout'),
					block: this.getId()
				});
			} else {
				url = this.url('catalog/admin/category/inlineFormModal');
			}

		} else {
			url = this.url('cms/admin/navigation/inlineMenu', {
				item: this.menuKey
			});
		}

		return url;
	}

	refresh() {
		this.getWCache().remove(this.cacheKey);
		return this.reRender();
	}

	reRender() {
		return this.getMenu()
			.then(menu => {
				return this.renderToWrapper(this.getMenuTpl(), {
					menu
				});
			})
			.then(() => {
				return this.afterRender();
			});
	}

	getPropsForExport() {
		return super.getPropsForExport(['menuKey']);
	}

	remove() {
		if (this.hideTimer) {
			clearTimeout(this.hideTimer);
		}

		return super.remove();
	}

	getFileName() {
		return __filename;
	}
}