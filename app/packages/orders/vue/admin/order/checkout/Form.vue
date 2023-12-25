<template>
	<form
		class="checkout-settings-form col-md-8 offset-md-2"
		@submit.prevent="submit"
	>
<!--		<div class="block">-->
<!--			<h5 class="form-label">-->
<!--				{{ __('Logo') }}-->
<!--			</h5>-->
<!--			<p-->
<!--				v-if="!logo"-->
<!--				class="nologo text-center"-->
<!--			>-->
<!--				{{ __("There is no logo") }}-->
<!--			</p>-->
<!--			<div-->
<!--				class="logo-wrapper"-->
<!--				:class="!logo && 'd-none'"-->
<!--			>-->
<!--				<div-->
<!--					class="img"-->
<!--					:style="'background-image: url(' + makeImgUrl(logo) + ')'"-->
<!--				/>-->
<!--				<p class="text-center">-->
<!--					<button-->
<!--						class="btn btn-outline-secondary btn-sm"-->
<!--						type="button"-->
<!--						@click.prevent="rmLogo"-->
<!--					>-->
<!--						<i class="fa fa-remove" />-->
<!--						{{ ' ' }}-->
<!--						{{ __('Remove') }}-->
<!--					</button>-->
<!--				</p>-->
<!--			</div>-->
<!--			<div class="admin-dropzone">-->
<!--				<div-->
<!--					ref="dz"-->
<!--					class="dropzone-uploader dropzone"-->
<!--				/>-->
<!--			</div>-->
<!--		</div>-->

		<div class="block mb-4">
			<h5>{{ __('Minimal order amount') }}</h5>
			<div class="form-group">
				<div style="max-width: 300px;">
					<div class="input-group">
						<input type="number"
									 class="form-control"
									 name="minOrderAmount"
									 v-model="attrs.minOrderAmount"
									 @input="formChanged = true"
									 placeholder="0"
						/>
						<div class="input-group-text">
							{{getLocale().getCurrencySymbol()}}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="block mb-4">
			<h5>{{ __('Contact information') }}</h5>
			<div class="row form-group mb-0">
				<label class="col-sm-3">{{ __('Email') }}</label>
				<div class="col-sm-6">
					<div class="form-check form-check-inline">
						<label class="form-check-label">
							<input
								v-model="attrs.contactFields.email_show"
								type="checkbox"
								class="form-check-input"
								name="contactFields[email_show]"
								value="1"
								@input="formChanged = true"
							>
							{{ __('Visible') }}
						</label>
					</div>
					<div class="form-check form-check-inline">
						<label class="form-check-label">
							<input
								v-model="attrs.contactFields.email_required"
								type="checkbox"
								class="form-check-input"
								name="contactFields[email_required]"
								value="1"
								@input="formChanged = true"
							>
							{{ __('Required') }}
						</label>
					</div>
				</div>
			</div>
			<div class="row form-group">
				<label class="col-sm-3">{{ __('Phone number') }}</label>
				<div class="col-sm-6">
					<div class="form-check form-check-inline">
						<label class="form-check-label">
							<input
								v-model="attrs.contactFields.phone_show"
								type="checkbox"
								class="form-check-input"
								name="contactFields[phone_show]"
								value="1"
								@input="formChanged = true"
							>
							{{ __('Visible') }}
						</label>
					</div>
					<div class="form-check form-check-inline">
						<label class="form-check-label">
							<input
								v-model="attrs.contactFields.phone_required"
								type="checkbox"
								class="form-check-input"
								name="contactFields[phone_required]"
								value="1"
								@input="formChanged = true"
							>
							{{ __('Required') }}
						</label>
					</div>
				</div>
			</div>
		</div>

		<div class="block mb-4">
			<h5>{{ __('Customer accounts') }}</h5>
			<div class="form-group">
				<div
					v-for="option in options.accountPolicy"
					:key="option[0]"
					class="form-check"
				>
					<label class="form-check-label">
						<input
							v-model="attrs.accountPolicy"
							type="radio"
							class="form-check-input"
							name="accountPolicy"
							:value="option[0]"
							@input="formChanged = true"
						>
						{{ option[1] }}
					</label>
				</div>
			</div>
		</div>
		<div class="block mb-4">
			<h5>{{ __('Shipping and billing addresses') }}</h5>
			<label class="form-label">{{ __('Customer name') }}</label>
			<div class="form-group mb-3">
				<div class="form-check">
					<label class="form-check-label">
						<input
							:checked="attrs.customerNameRequired.includes('first')"
							type="radio"
							class="form-check-input"
							name="customerNameRequired"
							value="first,last"
							@input="formChanged = true"
						>
						{{ __('First and Last names are required') }}
					</label>
				</div>
				<div class="form-check">
					<label class="form-check-label">
						<input
							:checked="attrs.customerNameRequired.length > 0 && !attrs.customerNameRequired.includes('first')"
							type="radio"
							class="form-check-input"
							name="customerNameRequired"
							value="last"
							@input="formChanged = true"
						>
						{{ __('Require Last name only') }}
					</label>
				</div>
				<div class="form-check">
					<label class="form-check-label">
						<input
							:checked="attrs.customerNameRequired == ''"
							type="radio"
							class="form-check-input"
							name="customerNameRequired"
							value=""
							@input="formChanged = true"
						>
						{{ __('The name is optional') }}
					</label>
				</div>
			</div>
			<label class="form-label">{{ __('Address line 2') }}</label>
			<div class="mb-2 form-group">
				<div class="form-check form-check-inline">
					<label class="form-check-label">
						<input
							v-model="attrs.addressLine2"
							type="radio"
							class="form-check-input"
							name="addressLine2"
							value="hidden"
							@input="formChanged = true"
						>
						{{ __('Hidden') }}
					</label>
				</div>
				<div class="form-check form-check-inline">
					<label class="form-check-label">
						<input
							v-model="attrs.addressLine2"
							type="radio"
							class="form-check-input"
							name="addressLine2"
							value="optional"
							@input="formChanged = true"
						>
						{{ __('Optional') }}
					</label>
				</div>
				<div class="form-check form-check-inline">
					<label class="form-check-label">
						<input
							v-model="attrs.addressLine2"
							type="radio"
							class="form-check-input"
							name="addressLine2"
							value="required"
							@input="formChanged = true"
						>
						{{ __('Required') }}
					</label>
				</div>
			</div>
			<label class="form-label">{{ __('Company name') }}</label>
			<div class="form-group">
				<div class="form-check form-check-inline">
					<label class="form-check-label">
						<input
							v-model="attrs.companyName"
							type="radio"
							class="form-check-input"
							name="companyName"
							value="hidden"
							@input="formChanged = true"
						>
						{{ __('Hidden') }}
					</label>
				</div>
				<div class="form-check form-check-inline">
					<label class="form-check-label">
						<input
							v-model="attrs.companyName"
							type="radio"
							class="form-check-input"
							name="companyName"
							value="optional"
							@input="formChanged = true"
						>
						{{ __('Optional') }}
					</label>
				</div>
				<div class="form-check form-check-inline">
					<label class="form-check-label">
						<input
							v-model="attrs.companyName"
							type="radio"
							class="form-check-input"
							name="companyName"
							value="required"
							@input="formChanged = true"
						>
						{{ __('Required') }}
					</label>
				</div>
			</div>
		</div>

		<div class="block mb-4">
			<h5>{{ __('Footer links') }}</h5>
			<table class="table w-100 mb-0">
				<thead>
					<tr>
						<td>{{ __('Name') }}</td>
						<td>{{ __('URL') }}</td>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="(link,i) in footerLinks"
						:key="i"
					>
						<td>
							<div class="form-group">
								<input
									v-model="link.title"
									class="form-control"
									:name="`footerLinks[${i}][title]`"
									placeholder="Some name"
									@input="formChanged = true"
								>
							</div>
						</td>
						<td>
							<div class="form-group">
								<input
									v-model="link.url"
									class="form-control"
									:name="`footerLinks[${i}][url]`"
									placeholder="/page/some-page"
									@input="formChanged = true"
								>
							</div>
							<div
								v-if="footerLinks.length > 1"
								class="text-end"
							>
								<a
									href="#"
									class="btn btn-link btn-sm"
									@click.prevent="rmLink(i)"
								>{{ __('Remove link') }}</a>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="text-start">
				<a
					href="#"
					class="btn btn-link btn-sm"
					@click.prevent="addLink"
				>
					<i class="fa fa-plus" />
					{{ __('Add link') }}
				</a>
			</div>
		</div>
		<div class="text-center">
			<button
				type="button"
				class="btn btn-primary"
				:disabled="!formChanged"
				@click.prevent="submit"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/>
				{{ formChanged ? __('Save') : __('Saved') }}
			</button>
		</div>
	</form>
</template>

<script>
import DropzoneWrapper from '../../../../../cms/widgets/dropzoneWrapper.client';
import {getImgCloudUrl} from '../../../../../../modules/s3Storage/cloudUrl';

export default {
	components: {},
	props: ['form'],
	data() {
		return {
			attrs: this.form.attrs ? {...this.form.attrs} : {contactFields: {}},
			footerLinks: this.form.attrs.footerLinks || [{
				title: '',
				url: ''
			}],
			options: this.form.options,
			formChanged: false,
			logo: this.form.logo || null
		};
	},

	mounted() {
		this.$bundle('adminUI').then(() => this.setup());
	},

	beforeDestroy() {
		if (this.dz)
			this.dz.remove();
	},

	methods: {
		setup() {
			// this.dz = new DropzoneWrapper(
			// 	this.$refs.dz,
			// 	this.url('orders/admin/setup/order/logoUpload'),
			// 	{
			// 		successMessage: false,
			// 		onSuccessHook: (file, response) => {
			// 			this.logo = response.files[0];
			// 		}
			// 	}
			// );
		},

		submit() {
			this.$form(this.$el)
				.submit(['orders/admin/setup/order/form'])
				.then(() => {
					this.formChanged = false;
				});
		},

		makeImgUrl(localPath) {
			return getImgCloudUrl(localPath, 200);
		},

		addLink() {
			this.formChanged = true;
			this.footerLinks.push({
				title: '',
				url: ''
			});
		},

		rmLink(index) {
			this.footerLinks = this.footerLinks.filter((el, i) => i != index);
			this.formChanged = true;
		},

		rmLogo() {
			this.$ajax.get(['orders/admin/setup/order/rmLogo'])
				.then(() => this.logo = null);
		}
	}
};
</script>