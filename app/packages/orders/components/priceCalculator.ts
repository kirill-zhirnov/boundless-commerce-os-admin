import moolah from 'moolah';

export function calcFinalPrice(basicPrice: number|string, discountAmount: number|string|null = null, discountPercent: number|string|null = null): string {
	let finalPrice: string = String(basicPrice);

	if (discountPercent) {
		finalPrice = moolah(finalPrice).discount(discountPercent).string();
	}

	if (discountAmount) {
		finalPrice = moolah(finalPrice).less(discountAmount).string();
	}

	return finalPrice;
}

export function calcTotalPrice(finalPrice: number|string, qty: number|string): string {
	//@ts-ignore
	qty = parseInt(qty);

	return moolah(finalPrice).times(qty).string();
}