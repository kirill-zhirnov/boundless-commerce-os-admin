import Vuex from 'vuex';

const getDefaultState = () => {
	return {
		saved: true,
		//to trigger components related on save
		onSuccess: 0,

		//publishing_status: draft|published|hidden
		status: null,

		title: '',

		parentId: null
	};
};

export default new Vuex.Store({
	state() {
		return getDefaultState();
	},

	mutations: {
		setSaved(state, value) {
			state.saved = value;

			if (value)
				state.onSuccess++;
		},

		setStatus(state, value) {
			state.status = value;
		},

		setTitle(state, title) {
			state.title = title;
		},

		setParentId(state, parentId) {
			state.parentId = parentId;
		},
	}
});