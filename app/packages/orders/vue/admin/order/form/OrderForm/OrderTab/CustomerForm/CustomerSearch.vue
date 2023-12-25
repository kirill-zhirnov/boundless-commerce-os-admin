<template>
	<input
		ref="search"
		type="text"
		class="form-control"
		:placeholder="__('Customer name')"
	>
</template>

<script>
import {convertResponse, highlight} from '../../../../../../../../system/modules/autocomplete.client';
import gHtml from '../../../../../../../../../modules/gHtml/index.client';
import $ from 'jquery';
import {mapState} from 'vuex';

export default ({
	props: ['selectCustomer'],
	computed: {
		...mapState(['order'])
	},
	mounted() {
		$(this.$refs.search).autocomplete({
			minChars: 2,
			forceFixPosition: true,
			onSelect: (selected) => {
				if (selected?.data?.id) this.$emit('selected', selected?.data?.id);
			},
			lookup: (suggestion, callback) => {
				this.$ajax.get(['customer/admin/customer/autocomplete'], {q: suggestion})
					.then((data) => {
						const out = data.map(el => ({...el, value: el.fullName}));
						callback(
							convertResponse(suggestion, out)
						);
					});
			},
			formatResult: (suggestion, search) => {
				let out = highlight(search, suggestion.value);
				if (suggestion.data.contact)
					out += gHtml.tag('p', {class: 'mb-0'}, suggestion.data.contact);
				if (suggestion.data.city)
					out += gHtml.tag('p', {class: 'mb-0'}, suggestion.data.city);

				out = gHtml.tag('section', {}, out);

				return out;
			},
		});
	},
	beforeDestroy() {
		$(this.$refs.search).autocomplete('dispose');
	},
	methods: {
		setCustomer(personId) {
			this.$ajax.post(['orders/admin/order/customer/set'], {order: this.order.order_id, person: personId})
				.then((data) => console.log('aaaa console.log', data));
		}
	}
});
</script>
