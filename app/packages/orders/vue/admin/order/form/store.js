import Vuex from 'vuex';
import TotalCalculator from '../../../../components/totalCalculator';
// import config from '../../../../../../../config';
import ajax from './../../../../../../modules/ajax/kit.client';

const getDefaultState = () => {
	return {
		tab: 'main',
		tabWithErr: [],
		hasUnsavedData: false,
		order: null,
		orderIsLocked: false,
		gridParams: {},
		submitCounter: 0,
		loading: false,
		orderList: [],
		attributes: [],
		attributesValues: {},
		removedAttr: [],
		shipping: null,
		discounts: [],
		calculator: new TotalCalculator(),
		trackingNumbers: [],
		additionTabFetched: false,
		paymentTransactions: [],
		taxSettings: null,
		taxClasses: null,
		totalCalculated: null,
		customer: null
	};
};

export default new Vuex.Store({
	strict: process.env.NODE_ENV !== 'production',
	state() {
		return getDefaultState();
	},
	mutations: {
		reset(state) {
			Object.assign(state, getDefaultState());
		},
		tab(state, tab) {
			state.tab = tab;
		},
		formChanged(state) {
			state.hasUnsavedData = true;
		},
		formSaved(state) {
			state.hasUnsavedData = false;
		},
		setOrder(state, order) {
			state.order = order;
		},
		setGridParams(state, grid) {
			state.gridParams = grid;
		},
		submit(state) {
			state.submitCounter++;
		},
		setLoading(state, isLoading) {
			state.loading = isLoading;
		},
		setTabWithErr(state, tabs) {
			state.tabWithErr = tabs;
		},
		setOrderIsLocked(state, orderIsLocked) {
			state.orderIsLocked = orderIsLocked;
		},
		setOrderList(state, orderList) {
			state.orderList = orderList;
			state.calculator.clearItems();
			for (const item of orderList) {
				let taxStatus = 'none';
				let taxClassId = null;

				if (['variant', 'product'].includes(item.type)) {
					taxStatus = item.product.tax_status;
					taxClassId = item.product.tax_class_id;
				}

				state.calculator.addItem(item.item_id, item.final_price, item.qty, taxStatus, taxClassId);
			}
		},
		setShippingInfo(state, shipping) {
			state.shipping = shipping;
			state.calculator.setShipping(
				Number(shipping?.price) || 0,
				shipping ? 1 : null
			);
		},
		setDiscounts(state, discounts) {
			state.discounts = discounts;
			state.calculator.clearDiscounts();
			state.calculator.setDiscounts(discounts.map(el => ({
				type: el.discount_type,
				value: Number(el.value)
			})));
		},
		setPaymentMethod(state, paymentMethod) {
			let markup;
			if (paymentMethod) {
				state.order.payment_method_id = paymentMethod.payment_method_id;
				state.order.paymentMethod = paymentMethod;
				markup = Number(paymentMethod.mark_up);
			} else {
				state.order.payment_method_id = null;
				state.order.paymentMethod = null;
				markup = 0;
			}

			state.calculator.setPaymentMarkUp(markup);
		},
		removeItemFromOrderList(state, ids) {
			state.orderList = state.orderList.filter(item => !ids.includes(item.item_id));
			for (const id of ids) {
				state.calculator.rmItem(id);
			}
		},
		changeSingleItemPrice(state, data) {
			const index = state.orderList.findIndex(item => data.item_id === item.item_id.toString());
			state.calculator.changeItemPrice(Number(data.item_id), Number(data.final_price) || 0);

			Object.assign(state.orderList[index], {
				...state.orderList[index],
				basic_price: data.basic_price,
				final_price: data.final_price,
			});
		},
		addOrReplaceItem(state, item) {
			const index = state.orderList.findIndex(i => i.item_id === item.item_id);

			if (index === -1) {
				state.orderList.push(item);
				state.calculator.addItem(
					Number(item.item_id),
					Number(item.final_price) || 0,
					Number(item.qty)
				);
			} else {
				Object.assign(state.orderList[index], item);
				state.calculator.changeItem({
					id: Number(item.item_id),
					qty: Number(item.qty),
					price: Number(item.final_price) || 0,
				});
			}
		},
		changeItemQty(state, item) {
			const index = state.orderList.findIndex(i => i.item_id === item.item_id);
			if (index !== -1) {
				state.orderList[index].qty = Number(item.qty);
				state.calculator.changeItemQty(Number(item.item_id), Number(item.qty));
			}
		},
		setAttributes(state, data) {
			state.attributesValues = data.values || {};
			state.attributes = data.attributes;
		},
		setTrackingNumbers(state, data) {
			state.trackingNumbers = data;
		},
		removeTrackNumber(state, id) {
			state.trackingNumbers = state.trackingNumbers.filter(el => el.track_number_id !== id);
		},
		removeAttribute(state, data) {
			state.attributes = state.attributes.filter(el => Number(el.attr_id) !== Number(data.pk));
			delete state.attributesValues[data.key];
			state.removedAttr.push(data.key);
		},
		addAttribute(state, data) {
			state.attributes.push(data);
		},
		changeAttribute(state, data) {
			const index = state.attributes.findIndex(el => Number(el.attr_id) === Number(data.pk));
			if (index !== -1) {
				state.attributes[index] = data.attribute;
			}
		},
		sortAttrs(state) {
			state.attributes.sort((a, b) => Number(a.sort) - Number(b.sort));
		},
		setRemovedAttr(state, data) {
			state.removedAttr = data || [];
		},
		setPaymentTransactions(state, paymentTransactions) {
			state.paymentTransactions = paymentTransactions;
		},
		setAdditionTabFetched(state, value) {
			state.additionTabFetched = value;
		},
		setTaxSettings(state, value) {
			state.calculator.setTaxSettings(value);
			state.taxSettings = value;
		},
		setTaxClasses(state, value) {
			state.calculator.setTaxClasses(value);
			state.taxClasses = value;
		},
		calcTotal(state) {
			state.totalCalculated = state.calculator.calcTotal();
		},
		setCustomer(state, value) {
			if (value) {
				const shippingAddr = value?.personAddresses?.find(el => el.type === 'shipping') || null;
				const billingAddr = value?.personAddresses?.find(el => el.type === 'billing') || null;
				state.calculator.setShippingLocation(shippingAddr);
				state.calculator.setBillingLocation(billingAddr);
			} else {
				state.calculator.resetLocations();
			}

			state.customer = value;
		}
	},
	actions: {
		async getOrderItemsList(state, data) {
			const response = await ajax.get(`/orders/admin/order/items/list?order=${data.orderId}`);

			state.commit('setOrderList', response);
		},
		async getOrderAttributes(state) {
			const attrs = await ajax.get(`/orders/admin/order/customAttrs/list?order=${state.state.order.order_id}`);

			state.commit('setAttributes', attrs);
		},
		async getShippingInfo(state, data) {
			const {shipping} = await ajax.get(`/orders/admin/order/shipping/data?order=${data.orderId}`);

			state.commit('setShippingInfo', shipping);
		},
		async getDiscounts(state, data) {
			const {discounts} = await ajax.get(`/orders/admin/order/discount/list?order=${data.orderId}`);

			state.commit('setDiscounts', sortDiscounts(discounts));
		},
		async rmShipping(state, data) {
			const res = await ajax.get('/orders/admin/order/shipping/rm', {order: data.orderId});
			if (res) {
				state.commit('setShippingInfo', null);
			}
		},
		async rmDiscount(state, data) {
			const res = await ajax.post('/orders/admin/order/discount/rm', {id: data.id});
			if (res) {
				state.dispatch('getDiscounts', {orderId: data.orderId});
			}
		},
		async removeOrderItem(state, data) {
			await ajax.post('/orders/admin/order/items/rm', {order: data.orderId, items: data.itemsList});

			state.commit('removeItemFromOrderList', data.itemsList);
		},
		async getTrackingNumbers(state) {
			const {trackingNumbers} = await ajax.get('/orders/admin/order/tracking/list', {order: state.state.order.order_id});

			state.commit('setTrackingNumbers', trackingNumbers);
		},
		async rmTrackNumber(state, id) {
			const res = await ajax.get('/orders/admin/order/tracking/rm', {id});

			if (res) {
				state.commit('removeTrackNumber', id);
			}
		},
		async removeOrderAttr(state, data) {
			await ajax.get('/orders/admin/order/customAttrs/rm', {id: data.pk});

			state.commit('removeAttribute', data);
		},
		async changeOrderAttr(state, data) {
			state.commit('changeAttribute', data);
			state.commit('sortAttrs');
		},

		async rmPaymentMethod(state) {
			await ajax.post('/orders/admin/order/paymentMethod/rm', {order: state.state.order.order_id});

			state.commit('setPaymentMethod', null);
		},

		async fetchAdditionTab({state, commit}) {
			const {transactions} = await ajax.get('/orders/admin/order/paymentTransaction/collection', {orderId: state.order.order_id});

			commit('setPaymentTransactions', transactions);
			commit('setAdditionTabFetched', true);
		},

		async fetchCustomer(state, data) {
			const {person} = await ajax.get(['orders/admin/order/customer/fetch'], {order: data.orderId});
			state.commit('setCustomer', person || null);
		},

		async setCustomer(state, {orderId, personId}) {
			await ajax.post(['orders/admin/order/customer/set'], {order: orderId, person: personId});
			state.dispatch('fetchCustomer', {orderId});
		},

		async rmCustomer(state, {orderId}) {
			await ajax.post(['orders/admin/order/customer/rm'], {order: orderId});
			state.commit('setCustomer', null);
		}
	}
});

// сортирует скидки по принципу сначала те, у которых source === 'coupon', потом 'manual'
const sortDiscounts = (discounts) => {
	if (!discounts || !Array.isArray(discounts) || !discounts.length) return [];
	const out = discounts.sort((a, b) => a.source > b.source ? 1 : -1);
	return out;
};