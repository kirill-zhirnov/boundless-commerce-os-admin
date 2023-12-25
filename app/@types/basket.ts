import {IBasketRow} from '../packages/orders/models/basket';

export interface IBasket {
	addItem: (itemId: number, qty?: number, priceId?: number, basicPrice?: string|number, finalPrice?: string|number, discountAmount?: string|number, discountPercent?: string|number) => Promise<void>;
	remove: (itemId: number) => Promise<void>;
	setQty: (itemId: number, qty: number) => Promise<void>;

	calcSummary: () => Promise<any>;

	loadItems: (langId?: number, pointId?: number, basketId?: number, trx?: any) => Promise<{items: any; total: any}>;
	getItems: (langId: number, pointId: number, basketId?: number, trx?: any) => Promise<{items: any; total: any}>;

	makeBasketInactive: (trx?: any) => Promise<void>;

	getBasket: () => Promise<IBasketRow>;
}