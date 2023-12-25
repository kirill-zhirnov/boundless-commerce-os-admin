import Vuex from 'vuex';

const getDefaultState = () => {
	return {
		tab: 'product',
		productTitle: null,
		saved: true,

		//publishing_status: draft|published|hidden
		status: null,

		/**
		 * State needs for passing if "save" is clicked (e.g. in TopNav) - ProductForm watches
		 * for changes and execute save if submit is changed.
		 */
		submit: 0,

		/**
		 * Это временный костыль для отслеживания сохраненного состояния,
		 * Если saved: true/false будет корретно работать, то onSuccess можно убрать.
		 */
		onSuccess: 0,

		loading: false,
		tabWithErr: [],
		commodityGroup: null,
		characteristicValues: null,
		hasVariants: false,
		img: null,
		gridParams: {},

		variantsUpdated: 0,
		trackInventory: false
	};
};

export default new Vuex.Store({
	state() {
		return getDefaultState();
	},

	mutations: {
		title(state, title) {
			state.productTitle = title;
		},

		tab(state, tab) {
			state.tab = tab;
		},

		reset(state) {
			Object.assign(state, getDefaultState());
		},

		submit(state) {
			state.submit++;
		},

		setLoading(state, isLoading) {
			state.loading = isLoading;
		},

		setTabWithErr(state, tabs) {
			state.tabWithErr = tabs;
		},

		setCommodityGroup(state, group) {
			state.commodityGroup = group;
		},

		setSaved(state, value) {
			state.saved = value;

			if (value)
				state.onSuccess++;
		},

		setCharacteristicValues(state, value) {
			state.characteristicValues = value;
		},

		setHasVariants(state, value) {
			state.hasVariants = value;
		},

		upVariantsUpdated(state) {
			state.variantsUpdated++;
		},

		setImg(state, value) {
			state.img = value;
		},

		setStatus(state, value) {
			state.status = value;
		},

		setGridParams(state, value) {
			state.gridParams = value;
		},

		setTrackInventory(state, value) {
			state.trackInventory = Boolean(value);
		}
	}
});