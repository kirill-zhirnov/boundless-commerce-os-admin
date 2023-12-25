<template>
	<div class="order-customer order-form__tinted-box">
		<div class="order-customer__block-title">
			<label><i
				class="fa fa-user me-2"
				aria-hidden="true"
			/>{{ __("Customer") }}</label>
			<button
				v-if="person"
				@click.prevent="onRmCustomer"
				class="btn btn-outline-secondary btn-sm"
				:disabled="orderIsLocked"
			>
				<i
					class="fa fa-times"
					aria-hidden="true"
				/>
			</button>
		</div>
		<div v-if="person">
			<div class="order-customer__customer-info">
				<div class="order-customer__title">
					<div>
						{{ person.personProfile.first_name }} {{ ' ' }}{{ person.personProfile.last_name }}
					</div>
					<button
						:href="url('orders/admin/order/customer/form', {order, pk: person.person_id})"
						data-modal=""
						:disabled="orderIsLocked"
						class="btn btn-outline-secondary btn-sm ms-auto"
					>
						{{ __('Edit') }}
					</button>
				</div>
				<p
					v-if="person.email"
					class="mb-2 text-nowrap d-flex"
				>
					<a
						:href="`mailto:${person.email}`"
						class="contact-overflow"
					>
						<i
							class="fa fa-envelope-o me-2"
							aria-hidden="true"
						/> {{ person.email }}
					</a>
					<a
						href="#"
						class="ms-auto"
						@click.prevent="copyElem"
					>
						<i
							class="fa fa-copy"
							aria-hidden="true"
						/>
					</a>
				</p>
				<p
					v-if="person.personProfile.phone"
					class="mb-2 text-nowrap d-flex"
				>
					<a
						:href="`tel:${person.personProfile.phone}`"
						class="contact-overflow"
					>
						<i class="fa fa-phone me-2" /> {{ phone }}
					</a>
					<a
						href="#"
						class="ms-auto"
						@click.prevent="copyElem"
					>
						<i
							class="fa fa-copy"
							aria-hidden="true"
						/>
					</a>
				</p>
				<p
					v-if="person.personProfile.comment"
					class="text-muted"
				>
					<em>{{ person.personProfile.comment }}</em>
				</p>
			</div>
			<AddressItem
				:address="shipping_addr"
				:person="person.person_id"
				:order="order"
				:order-is-locked="orderIsLocked"
				type="shipping"
			/>
			<AddressItem
				:address="billing_addr"
				:person="person.person_id"
				:has-shipping="Boolean(shipping_addr)"
				:order="order"
				:order-is-locked="orderIsLocked"
				type="billing"
				class="mb-0"
			/>
		</div>
		<div v-else>
			<CustomerSearch @selected="selectCustomer" />
			<div class="mt-2">
				<a
					:href="url('orders/admin/order/customer/form', {order})"
					data-modal=""
				>
					<i
						class="fa fa-plus"
						aria-hidden="true"
					/>
					{{ __('Create new customer') }}
				</a>
			</div>
		</div>
	</div>
</template>
<script>
import AddressItem from './CustomerForm/AddressItem.vue';
import CustomerSearch from './CustomerForm/CustomerSearch.vue';
import $ from 'jquery';
import {copyEl2Clipboard} from '../../../../../../../../modules/utils/copy';
import {maskPhoneText} from '../../../../../../../../modules/utils/mask';
import {mapActions, mapState} from 'vuex';

export default {
	components: {AddressItem, CustomerSearch},
	props: ['order'],
	data() {
		return {
			shipping_addr: null,
			billing_addr: null,
		};
	},
	computed: {
		...mapState({
			orderIsLocked: 'orderIsLocked',
			person: 'customer'
		}),
		phone() {
			return maskPhoneText(this.person?.personProfile?.phone || '');
		}
	},
	watch: {
		person(value) {
			this.shipping_addr = value?.personAddresses?.find(el => el.type === 'shipping') || null;
			this.billing_addr = value?.personAddresses?.find(el => el.type === 'billing') || null;
		}
	},
	mounted() {
		this.fetchCustomer({orderId: this.order});
	},
	beforeMount() {
		this.listenTo$(document, 'success.form', '.customer-edit-form', () => {
			this.fetchCustomer({orderId: this.order});
		});
		this.listenTo$(document, 'success.form', '.customer-address-form', () => {
			this.fetchCustomer({orderId: this.order});
		});
	},
	methods: {
		onRmCustomer() {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.rmCustomer({orderId: this.order});
		},
		selectCustomer(personId) {
			this.setCustomer({orderId: this.order, personId});
		},
		copyElem(e) {
			copyEl2Clipboard($(e.currentTarget).prev().get(0));
		},
		...mapActions(['fetchCustomer', 'setCustomer', 'rmCustomer'])
	}
};
</script>