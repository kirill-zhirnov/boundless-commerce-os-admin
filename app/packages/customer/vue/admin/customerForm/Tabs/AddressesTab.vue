<template>
	<div class="customer-address-tab">
		<p class="mb-4">
			<a
				:href="url('customer/admin/address/form', {person: forms.person.person_id})"
				data-modal=""
				class="btn btn-outline-secondary"
			>
				<i
					class="fa fa-plus"
					aria-hidden="true"
				/> {{ __('Add address') }}
			</a>
		</p>
		<template v-if="fetched">
			<AddressItem
				v-for="address in addresses"
				:key="address.address_id"
				:address="address"
				:person="forms.person.person_id"
			/>
		</template>
	</div>
</template>
<script>
import {mapActions, mapMutations, mapState} from 'vuex';
import AddressItem from './AddressesTab/AddressItem.vue';

export default {
	components: {AddressItem},
	props: ['forms'],
	data() {
		return {
			fetched: false
		};
	},
	computed: {
		...mapState(['addresses', 'tab'])
	},
	watch: {
		tab() {
			if (this.tab === 'addresses' && !this.fetched) {
				this.getCustomerAddresses({person_id: this.forms.person.person_id})
					.then(() => {
						this.fetched = true;
					});
			}
		}
	},
	beforeMount() {
		this.listenTo$(document, 'success.form', '.customer-address-form', () => {
			this.getCustomerAddresses({person_id: this.forms.person.person_id});
		});
	},
	mounted() {
		if (this.tab === 'addresses' && !this.fetched) {
			this.getCustomerAddresses({person_id: this.forms.person.person_id})
				.then(() => {
					this.fetched = true;
				});
		}
	},
	methods: {
		...mapActions(['getCustomerAddresses']),
		...mapMutations(['formChanged'])
	}
};
</script>