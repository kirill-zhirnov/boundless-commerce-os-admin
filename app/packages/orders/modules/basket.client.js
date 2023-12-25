import ajax from '../../../modules/ajax/kit.client';
import $ from 'jquery';

export async function add(itemId, route = null, extraParams = null) {
	route = route || '@to-basket';

	const params = Object.assign({
		item: itemId
	}, extraParams);

	const res = await ajax.get([route, params]);
	if (res.result) {
		// analytics.addToBasket(res.item);
	}

	return res;
}

export function triggerRefreshed() {
	return $(document).trigger('refreshed.basket', Array.from(arguments));
}

export function triggerAdded() {
	return $(document).trigger('added.basket', Array.from(arguments));
}
