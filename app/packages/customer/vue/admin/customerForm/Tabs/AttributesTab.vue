<template>
	<div class="customer-attributes-tab">
		<AttributesList
			v-if="fetched"
			:attributes="attributes"
			:values="values"
			:add-url="url('customer/admin/customAttrs/form', { person: personId })"
			edit-url="customer/admin/customAttrs/form"
		/>
	</div>
</template>
<script>

import {mapActions, mapMutations, mapState} from 'vuex';
import AttributesList from '../../../../../orders/vue/admin/order/form/AttributesForm/AttributesTab/AttributesList.vue';

export default {
	components: {
		AttributesList
	},
	data() {
		return {
			values: {},
			fetched: false
		};
	},
	computed: {
		...mapState([
			'personId',
			'attributes',
			'attributesValues',
			'removedAttr',
			'tab'
		]),
	},
	watch: {
		tab() {
			if (this.tab === 'attributes' && !this.fetched) {
				this.getAttributes().then(() => {
					this.values = {...this.attributesValues};
					this.fetched = true;
				});
			}
		},
		removedAttr(removed) {
			if (!removed.length) return;
			for (const key of removed) {
				delete this.values[key];
			}
			this.setRemovedAttr([]);
		}
	},
	methods: {
		...mapActions(['getAttributes']),
		...mapMutations(['setRemovedAttr'])
	}
};
</script>