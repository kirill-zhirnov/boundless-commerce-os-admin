<template>
	<div class="customer-edit-form">
		<form
			name="customer"
			@submit.prevent="submit"
		>
			<input
				v-if="pk"
				:value="pk"
				type="hidden"
				name="pk"
			>
			<div class="row">
				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="first_name"
					> {{ __("First name:") }} </label>
					<input
						id="first_name"
						v-model="customer.first_name"
						class="form-control"
						name="first_name"
					>
				</div>
				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="last_name"
					> {{ __("Last name:") }} </label>
					<input
						id="last_name"
						v-model="customer.last_name"
						class="form-control"
						name="last_name"
					>
				</div>
			</div>
			<div class="row">
				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="email"
					> {{ __("Email:") }} </label>
					<input
						id="email"
						v-model="customer.email"
						class="form-control"
						name="email"
						type="email"
					>
				</div>
				<MaskedPhone
					v-model="customer.phone"
					group-class-name="col-md-6 form-group"
					:label="__('Phone number:')"
				/>
			</div>
			<div class="checkbox form-check mb-4">
				<label class="form-check-label">
					<input
						v-model="customer.receive_marketing_info"
						name="receive_marketing_info"
						type="checkbox"
						value="1"
						class="form-check-input"
					>
					{{ __("Subscribed on marketing emails") }}
				</label>
			</div>
			<div
				v-if="isNew"
				class="checkbox form-check mb-4"
			>
				<label class="form-check-label">
					<input
						v-model="customer.send_welcome_email"
						name="send_welcome_email"
						type="checkbox"
						value="1"
						class="form-check-input"
					>
					{{ __("Send welcome email") }}
				</label>
			</div>
			<div class="form-group">
				<label
					class="form-label"
					for="comment"
				> {{ __("Comment (not visible to customer):") }} </label>
				<textarea
					id="comment"
					v-model="customer.comment"
					rows="2"
					name="comment"
					class="form-control"
				/>
			</div>
			<div
				v-show="isNew"
				class="checkbox form-check mb-4"
			>
				<label class="form-check-label">
					<input
						v-model="fillAddress"
						class="form-check-input"
						name="fill_shipping_address"
						type="checkbox"
						value="1"
					>
					{{ __("Fill shipping address") }}
				</label>
			</div>
		</form>
		<form
			v-if="fillAddress"
			name="address"
		>
			<div class="form-group">
				<label
					class="form-label"
					for="company"
				> {{ __("Company:") }} </label>
				<input
					id="company"
					v-model="address.company"
					class="form-control"
					name="company"
				>
			</div>
			<div class="form-group">
				<label
					class="form-label"
					for="address_line_1"
				> {{ __("Address line 1:") }} </label>
				<input
					id="address_line_1"
					v-model="address.address_line_1"
					class="form-control"
					name="address_line_1"
				>
			</div>
			<div class="form-group">
				<label
					class="form-label"
					for="address_line_2"
				> {{ __("Address line 2:") }} </label>
				<input
					id="address_line_2"
					v-model="address.address_line_2"
					class="form-control"
					name="address_line_2"
				>
			</div>

			<div class="row">
				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="city"
					> {{ __("City:") }} </label>
					<input
						id="city"
						v-model="address.city"
						class="form-control"
						name="city"
					>
				</div>
				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="zip"
					> {{ __("Postcode/ZIP:") }} </label>
					<input
						id="zip"
						v-model="address.zip"
						class="form-control"
						name="zip"
					>
				</div>
			</div>

			<div class="row">
				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="country_id"
					>
						{{ __('Country:') }}
					</label>
					<select
						id="country_id"
						v-model="address.country_id"
						name="country_id"
						class="form-select"
					>
						<option
							v-for="row in countryOptions"
							:key="row[0]"
							:value="row[0]"
						>
							{{ row[1] }}
						</option>
					</select>
				</div>

				<div class="col-md-6 form-group">
					<label
						class="form-label"
						for="state"
					> {{ __("State:") }} </label>
					<input
						id="state"
						v-model="address.state"
						class="form-control"
						name="state"
					>
				</div>
			</div>
		</form>
		<div class="text-center">
			<button
				class="btn btn-primary"
				@click="submit"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/> {{ __("Save") }}
			</button>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';
import MaskedPhone from '../../../../../../vue/components/MaskedPhone.vue';

export default {
	components: {MaskedPhone},
	props: ['forms'],
	data() {
		return {
			customer: this.forms?.customer?.attrs || {},
			address: this.forms?.address?.attrs || {},
			countryOptions: this.forms?.address?.options.country || [],
			pk: this.forms?.customer?.pk || null,
			isNew: this.forms?.customer?.scenario === 'insert',
			fillAddress: this.forms?.customer?.scenario === 'update' || false
		};
	},
	methods: {
		submit() {
			$('input[name="phone"]').unmask();
			this.$formGroup(this.$el)
				.submit(['orders/admin/order/customer/form', {order: this.forms?.customer?.order?.order_id, pk: this.pk}])
				.then(() => {
					$(this.$el).trigger('success.form');
				})
				.finally(() => {
					$('input[name="phone"]').maskPhone();
				});
		},
	}
};
</script>