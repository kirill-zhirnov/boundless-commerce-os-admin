import Vuex from 'vuex';
import ajax from './../../../../../modules/ajax/kit.client';

const getDefaultState = () => {
	return {
		tab: 'customer',
		person: {},
		personId: null,
		hasUnsavedData: false,
		submitCounter: 0,
		loading: false,
		addresses: [],
		attributes: [],
		attributeValues: {},
		removedAttr: [],
		orders: [],
		ordersTotal: {
			totalEntries: null,
			perPage: 10,
			page: 1
		}
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
		submit(state) {
			state.submitCounter++;
		},
		setLoading(state, isLoading) {
			state.loading = isLoading;
		},
		setAddresses(state, addresses) {
			state.addresses = addresses;
		},
		setAttributes(state, data) {
			state.attributesValues = data.values || {};
			state.attributes = data.attributes;
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
		setPerson(state, data) {
			state.personId = data;
		},
		setOrders(state, data) {
			[state.ordersTotal, state.orders] = data;
		},
		setOrdersPagination(state, data) {
			state.ordersTotal = data;
		},
		setPersonData(state, data) {
			state.person = data;
		}
	},
	actions: {
		async getCustomerAddresses(state, data) {
			const response = await ajax.get('/customer/admin/address/list', {person: data.person_id});

			state.commit('setAddresses', response);
		},
		async removeCustomerAddress(state, data) {
			const res = await ajax.post('/customer/admin/address/rm', data);
			if (res) {
				state.dispatch('getCustomerAddresses', {person_id: data.person});
			}
		},
		async setDefaultAddress(state, data) {
			const res = await ajax.post('/customer/admin/address/setDefault', data);
			if (res) {
				state.dispatch('getCustomerAddresses', {person_id: data.person});
			}
		},
		async getAttributes(state) {
			const attrs = await ajax.get(`/customer/admin/customAttrs/list?person=${state.state.personId}`);

			state.commit('setAttributes', attrs);
		},
		async removeAttr(state, data) {
			await ajax.get('/customer/admin/customAttrs/rm', {id: data.pk});

			state.commit('removeAttribute', data);
		},
		async changeAttr(state, data) {
			state.commit('changeAttribute', data);
			state.commit('sortAttrs');
		},
		async getOrders(state) {
			const params = {
				customer_id: state.state.personId,
				page: state.state.ordersTotal.page,
				perPage: state.state.ordersTotal.perPage
			};
			const orders = await ajax.get('/orders/admin/orders/collection', params);

			state.commit('setOrders', orders);
		},
	}
});