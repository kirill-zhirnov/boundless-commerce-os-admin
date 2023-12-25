<template>
	<div class="customer-form">
		<p>
			<a
				:href="url('customer/admin/customer/index', grid)"
				class="text-muted"
			>
				<i class="fa fa-arrow-left" /> {{ __("Customers") }}
			</a>
		</p>
		<ul class="nav nav-tabs">
			<li
				class="nav-item"
				role="presentation"
			>
				<a
					:class="getTabClasses('customer')"
					href="#"
					@click.prevent="tabClicked('customer')"
				>{{
					__("Customer")
				}}</a>
			</li>
			<li
				class="nav-item"
				role="presentation"
			>
				<a
					:class="getTabClasses('addresses')"
					href="#"
					@click.prevent="tabClicked('addresses')"
				>{{
					__("Addresses")
				}}</a>
			</li>
			<li
				class="nav-item"
				role="presentation"
			>
				<a
					href="#"
					:class="getTabClasses('attributes')"
					@click.prevent="tabClicked('attributes')"
				>{{
					__("Custom attributes")
				}}</a>
			</li>
			<li
				class="nav-item"
				role="presentation"
			>
				<a
					href="#"
					:class="getTabClasses('orders')"
					@click.prevent="tabClicked('orders')"
				>{{ __("Orders") }}</a>
			</li>
		</ul>

		<div class="tabs-body">
			<CustomerTab
				v-show="tab == 'customer'"
				:forms="forms.customer"
			/>
			<AddressesTab
				v-show="tab == 'addresses'"
				:forms="forms.customer"
			/>
			<AttributesTab
				v-show="tab == 'attributes'"
				:forms="forms"
			/>
			<OrdersTab
				v-show="tab == 'orders'"
				:forms="forms"
			/>
		</div>
		<div class="footer-btns text-center">
			<SaveButton />
		</div>
	</div>
</template>
<script>
import {mapMutations, mapState} from 'vuex';
import OrdersTab from './Tabs/OrdersTab.vue';
import SaveButton from './Buttons/SaveButton.vue';
import AddressesTab from './Tabs/AddressesTab.vue';
import AttributesTab from './Tabs/AttributesTab.vue';
import CustomerTab from './Tabs/CustomerTab.vue';
import $ from 'jquery';

export default {
	components: {
		CustomerTab,
		SaveButton,
		AddressesTab,
		AttributesTab,
		OrdersTab
	},
	props: ['forms', 'grid'],
	computed: {
		...mapState(['tab', 'submitCounter'])
	},
	watch: {
		submitCounter() {
			this.execSubmit();
		}
	},
	mounted() {
		this.setPerson(this.forms.customer.pk);
		this.setPersonData(this.forms.customer.person);
		this.$store.commit('tab', 'customer');
	},

	methods: {
		tabClicked(tab) {
			this.$store.commit('tab', tab);
		},

		getTabClasses(tab) {
			const classes = ['nav-link'];
			if (this.tab == tab) classes.push('active');

			return classes;
		},
		execSubmit() {
			$('input[name="phone"]').unmask();
			this.setLoading(true);
			this.$formGroup(this.$el)
				.submit(['customer/admin/customer/form', {pk: this.forms.customer.pk}])
				.then(result => {
					this.formSaved();
					if (result.person) this.setPersonData(result.person);
				})
				.catch(err => {
					this.setLoading(false);
				})
				.finally(() => {
					this.setLoading(false);
					$('input[name="phone"]').maskPhone();
				});
		},
		...mapMutations(['setLoading', 'formSaved', 'setPerson', 'setPersonData'])
	}
};
</script>