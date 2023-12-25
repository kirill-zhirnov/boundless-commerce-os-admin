import adminBasket from './adminBasket.client';
import moolah from 'moolah';
import onEssenceChanged from '../../system/modules/onEssenceChanged';

import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IUser} from '../../../@types/user';
import OrderItemsBasketProvider from '../components/orderItems/basketProvider';

export default class Basket {
	/**
	 * @param {IInstanceRegistry} instanceRegistry
	 * @param {IUser} user
	 */
	constructor(instanceRegistry, user = null) {
		this.instanceRegistry = instanceRegistry;
		this.user = user;
		this.router = instanceRegistry.getRouter();
		this.basket = null;
		this.summary = null;

		this.db = this.instanceRegistry.getDb();
		this.settings = this.instanceRegistry.getSettings();
		this.imgProportion = null;
		this.basketProvider = null;

		if (this.user) {
			this.bindUserListeners();
		}
	}

	async addItem(itemId, qty = 1, priceId = null, basicPrice = null, finalPrice = null, discountAmount = null, discountPercent = null) {
		if (finalPrice === null) {
			finalPrice = basicPrice;
		}

		if (basicPrice != finalPrice && !discountAmount && !discountPercent) {
			discountAmount = moolah(basicPrice).less(finalPrice).string();
		}

		if (this.user && !this.user.getId()) {
			await this.user.makeGuestVisitor();
		}
		const basket = await this.getBasket();

		await this.getBasketProvider().addItem(basket.basket_id, itemId, qty, {
			price_id: priceId,
			basic_price: basicPrice,
			final_price: finalPrice,
			discount_amount: discountAmount,
			discount_percent: discountPercent
		});

		this.summary = null;
	}

	async remove(itemId) {
		const basket = await this.getBasket();
		await this.getBasketProvider().rmItems(basket.basket_id, [itemId]);

		this.summary = null;
	}

	async setQty(itemId, qty) {
		let wasChanged = false;

		const basket = await this.getBasket();
		const rows = await this.db.sql(`
			update
				basket_item
			set
				qty = :qty
			where
				basket_id = :basket
				and item_id = :item
				and qty != :qty
			returning *
		`, {
			basket: basket.basket_id,
			item: itemId,
			qty
		});

		if (rows.length > 0) {
			wasChanged = true;
		}

		this.summary = null;

		if (wasChanged) {
			await onEssenceChanged.trigger(this.instanceRegistry, 'basketItem', [itemId], 'setQty');
		}
	}

//	Returns model instance for Basket
	async getBasket() {
		if (this.basket) {
			return this.basket;
		}

		const params = {};
		if (this.user.getId()) {
			params.person = this.user.getId();
		}

		if (!params.person) {
			throw new Error('Basket: params cannot be empty.');
		}

		const rows = await this.db.sql('select * from basket_get(:person)', params);
		this.basket = rows[0];

		return this.basket;
	}

	setBasket(basket) {
		this.basket = basket;
		return this;
	}

	async calcSummary() {
		if (this.summary != null) {
			return this.summary;
		}

		if (!this.user.getId()) {
			this.summary = {
				qty: null,
				total: null
			};
			return this.summary;
		}

		const rows = await this.db.sql('\
select \
sum(qty) as qty, \
sum(final_price * qty) as total \
from \
basket_item bi \
inner join basket b using(basket_id) \
inner join item_price using(item_price_id) \
where \
person_id = :person \
and is_active = true \
and bi.deleted_at is null\
', {
			person: this.user.getId()
		});
		this.summary = rows[0];

		return this.summary;
	}

	async getItem(itemId, langId = null, pointId = null, basketId = null, trx = null) {
		const {items} = await this.getItems(langId, pointId, basketId, trx);
		//@ts-ignore
		for (const row of items) {
			if (row.item_id == itemId) {
				return row;
			}
		}

		return null;
	}

	async getItems(langId, pointId, basketId = null, trx = null) {
		if (this.user.getId()) {
			return this.loadItems(langId, pointId, basketId, trx);
		} else {
			return {
				items: [],
				total: {
					qty: null,
					price: null
				}
			};
		}
	}

	async loadItems(langId, pointId, basketId = null, trx = null) {
		if (!basketId) {
			const basket = await this.getBasket();
			basketId = basket.basket_id;
		}

		const total = {
			qty: 0,
			price: 0
		};
		const basketProvider = this.getBasketProvider();
		basketProvider.setTrx(trx);
		const rows = basketProvider.getItems(basketId, langId);
		basketProvider.setTrx(null);

		//@ts-ignore
		for (const row of rows) {
			//@ts-ignore
			const rowTotal = adminBasket.calcTotalPrice(row.final_price, row.qty);
			//@ts-ignore
			total.qty += row.qty;

			total.price = moolah(total.price).plus(rowTotal).string();
		}

		return {
			items: rows,
			total
		};
	}

	getBasketProvider() {
		if (!this.basketProvider) {
			this.basketProvider = new OrderItemsBasketProvider(this.instanceRegistry);
		}

		return this.basketProvider;
	}

	async makeBasketInactive(trx = null) {
		const basket = await this.getBasket();

		await this.db.model('basket').update({
			is_active: false
		}, {
			where: {
				basket_id: basket.basket_id
			},
			transaction: trx
		});

		this.summary = null;
	}

	bindUserListeners() {
		this.user.on('setUser', async (prevUser, newUser) => {
			let oldBasketRow = null;
			if (prevUser && prevUser.id && (prevUser.id !== newUser.id)) {
				const row = await this.db.model('basket').findOne({
					where: {
						person_id: prevUser.id,
						is_active: true
					}
				});

				if (row) {
					oldBasketRow = row;
					await this.db.model('basket').update({
						is_active: false
					}, {
						where: {
							person_id: newUser.id,
							is_active: true
						}
					});
				}

				if (oldBasketRow) {
					//@ts-ignore
					await oldBasketRow.set({person_id: newUser.id}).save();
				}
			}
		});

//			@basket = null
//			@summary = null
//
//			return Q()
//			.then () =>
//				if prevUser && prevUser.id
//					copyBasket = pathAlias '@p-orders/modules/copyBasket'
//					return copyBasket.copy @instanceRegistry, prevUser.id, @

		this.user.on('logout', () => {
			this.basket = null;
			this.summary = null;
		});
	}
}
