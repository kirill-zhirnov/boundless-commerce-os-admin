import Widget from '../../../modules/widget/widget.client';

export default class Basket extends Widget {
	constructor(options) {
		super(options);

		this.tagName = options.tagName || 'div';
		this.cacheKey = 'basket';
	}

	attributes() {
		const classes = ['cart'];
		classes.push(!this.data.basket || !this.data.basket.qty ? '' : 'is-active');

		return {
			class: classes.join(' '),
			href: this.url('orders/admin/orders/form')
		};
	}

	async run() {
		if (this.hasOrdersRole()) {
			await this.getBasketData();
			return this.render(this.getTplName());
		} else {
			return this.resolveEmpty();
		}
	}

	runLazyInit() {
		if (!this.hasOrdersRole()) {
			return;
		}

		this.listenTo$(document, 'added.basket', this.refreshBasket);

		this.listenTo$(document, 'refreshed.basket', this.refreshBasket);

		this.listenTo$(document, 'loggedIn.auth', this.refreshBasket);

		this.listenTo$(document, 'loggedOut.auth', this.refreshBasket);

		if (this.data.basket) {
			this.getWCache().save(this.cacheKey, this.data.basket);
		}
	}

	async refreshBasket() {
		this.getWCache().remove(this.cacheKey);

		await this.getBasketData();
		const html = await this.localRender(this.getTplName());

		if (this.$el) {
			return this.replace(this.wrapInWrapper(html, false));
		}

	}

	hasOrdersRole() {
		const roles = this.getView().getGlobalViewData('user').roles;
		const ordersRole = roles.find((role) => ['admin', 'orders-manager'].includes(role));

		return ordersRole ? true : false;
	}

	getTplName() {
		return this.data?.tpl ? `basket/${this.data.tpl}` : 'basket';
	}

	async getBasketData() {
		const basket = await this.getWCache().load(this.cacheKey, () => this.makeIsomorphicRequest(this.url('orders/basket/summary')));

		if (this.data != null) {
			this.data.basket = basket;
		}
		return basket;
	}

	getFileName() {
		return __filename;
	}
}