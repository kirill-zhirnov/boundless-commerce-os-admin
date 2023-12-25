<template>
	<div class="order-customer__address-item">
		<div class="order-customer__address-title">
			<label v-if="type === 'shipping'"><i
				class="fa fa-truck"
				aria-hidden="true"
			/>{{ ' ' }}{{ __("Shipping address") }}</label>
			<label v-if="type === 'billing'"><i
				class="fa fa-credit-card"
				aria-hidden="true"
			/>{{ ' ' }}{{ __("Billing address") }}</label>
			<button
				:href="url(`orders/admin/order/customer/addressByType?order=${order}&type=${type}`)"
				data-modal=""
				class="btn btn-outline-secondary btn-sm ms-auto"
				:disabled="orderIsLocked"
			>
				{{ address ? __('Edit') : __('Add') }}
			</button>
		</div>
		<div
			v-if="address"
			class="order-customer__address-details"
		>
			<div :id="`address-form-${address.address_id}`"
					 class="order-customer__address-wrap"
			>
				<p
					v-if="address.first_name || address.last_name"
					class="mb-2"
				>
					{{ address.first_name }} {{ address.last_name }}
				</p>
				<p
					v-if="address.company"
					class="mb-2"
				>
					{{ address.company }}
				</p>
				<p
					v-if="address.address_line_1"
					class="mb-2"
				>
					{{ address.address_line_1 }}
				</p>
				<p
					v-if="address.address_line_2"
					class="mb-2"
				>
					{{ address.address_line_2 }}
				</p>
				<p
					v-if="address.city || address.state"
					class="mb-2"
				>
					{{ address.city || '-' }}, {{ address.state }}
				</p>
				<p
					v-if="address.zip"
					class="mb-2"
				>
					{{ address.zip }}
				</p>
				<p
					v-if="address.country_id && address.vwCountry"
					class="mb-2"
				>
					{{ address.vwCountry.title }}
				</p>
				<p
					v-if="address.phone"
					class="mb-2"
				>
					<span class="masked-phone">
						{{ phone }}
					</span>
				</p>
				<p
					v-if="address.comment"
					class="text-muted"
				>
					<em>{{ address.comment }}</em>
				</p>
			</div>
			<a
				href="#"
				@click.prevent="copyAddr"
				class="order-customer__copy-address"
			>
				<i
					class="fa fa-copy"
					aria-hidden="true"
				/>
			</a>
		</div>
		<div v-else-if="type === 'billing' && hasShipping">
			{{ __('Same as shipping address') }}
		</div>
	</div>
</template>
<script>
import $ from 'jquery';
import {maskPhoneText} from '../../../../../../../../../modules/utils/mask';
import {copyMultiEl2Clipboard} from '../../../../../../../../../modules/utils/copy';

export default {
	props: ['address', 'person', 'order', 'type', 'hasShipping', 'orderIsLocked'],
	computed: {
		title() {
			return this.type === 'billing' ? this.__('Billing address') : this.__('Shipping address');
		},
		phone() {
			return maskPhoneText(this.address?.phone || '');
		}
	},
	methods: {
		copyAddr(e) {
			copyMultiEl2Clipboard($(e.currentTarget).parent(), $(`#address-form-${this.address.address_id} p`));
		},
	}
};
</script>