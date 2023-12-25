<template>
	<div class="d-flex mb-5">
		<div class="address-info">
			<h5 class="text-uppercase">
				<span v-if="address.type === 'billing'">{{ __('Billing address') }}</span>
				<span v-else-if="address.type === 'shipping'">{{ __('Shipping address') }}</span>
				<span v-else>{{ __('Other address') }}</span>
			</h5>
			<div>
				<p>{{ address.first_name }} {{ address.last_name }}</p>
				<p
					v-if="address.company"
					class="mb-0"
				>
					{{ address.company }}
				</p>
				<p
					v-if="address.address_line_1"
					class="mb-0"
				>
					{{ address.address_line_1 }}
				</p>
				<p
					v-if="address.address_line_2"
					class="mb-0"
				>
					{{ address.address_line_2 }}
				</p>
				<p
					v-if="address.city || address.state"
					class="mb-0"
				>
					{{ address.city || '-' }}, {{ address.state }}
				</p>
				<p
					v-if="address.zip"
					class="mb-0"
				>
					{{ address.zip }}
				</p>
				<p
					v-if="address.country"
					class="mb-0"
				>
					{{ address.country }}
				</p>
				<p
					v-if="address.phone"
					class="mb-0"
				>
					{{ phone }}
				</p>
				<p
					v-if="address.comment"
					class="text-muted"
				>
					<em>{{ address.comment }}</em>
				</p>
			</div>
		</div>
		<div class="mt-4 address-action">
			<a
				:href="url('customer/admin/address/form', {pk: address.address_id, person} )"
				data-modal=""
				class="btn btn-outline-secondary btn-sm"
			>
				<i class="fa fa-pencil" aria-hidden="true"></i> {{ __('Edit') }}
			</a>
			{{ ' ' }}
			<a
				href="#"
				@click.prevent="rm"
				class="btn btn-outline-secondary btn-sm"
			>
				<i class="fa fa-trash-o" aria-hidden="true"></i> {{ __('Remove') }}
			</a>
			{{ ' ' }}
			<span v-if="address.is_default">{{ __('default address') }}</span>
			<span v-else>
				<a
					href="#"
					@click.prevent="setDefault"
					class="btn btn-outline-secondary btn-sm"
				>
					{{ __('Set default') }}
				</a>
			</span>
		</div>
	</div>
</template>
<script>
import {mapActions} from 'vuex';
import {maskPhoneText} from '../../../../../../../modules/utils/mask';

export default {
	props: ['address', 'person'],
	computed: {
		phone() {
			return maskPhoneText(this.address?.phone || '');
		}
	},
	methods: {
		...mapActions(['removeCustomerAddress', 'setDefaultAddress']),
		rm() {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.removeCustomerAddress({address: this.address?.address_id, person: this.person});
		},
		setDefault() {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.setDefaultAddress({address: this.address?.address_id, person: this.person});
		},
	}
};
</script>