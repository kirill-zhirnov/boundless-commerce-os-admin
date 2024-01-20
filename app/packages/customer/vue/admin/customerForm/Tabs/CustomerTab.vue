<template>
	<form
		name="customer"
		@submit.prevent="submit"
	>
		<div class="row">
			<div class="col-md-6 form-group">
				<label
					class="form-label"
					for="first_name"
				> {{ __("First name:") }} </label>
				<input
					id="first_name"
					v-model="form.first_name"
					class="form-control"
					name="first_name"
					@input="formChanged"
				>
			</div>
			<div class="col-md-6 form-group">
				<label
					class="form-label"
					for="last_name"
				> {{ __("Last name:") }} </label>
				<input
					id="last_name"
					v-model="form.last_name"
					class="form-control"
					name="last_name"
					@input="formChanged"
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
					v-model="form.email"
					class="form-control"
					name="email"
					type="email"
					@input="formChanged"
				>
			</div>
			<MaskedPhone
				v-model="form.phone"
				group-class-name="col-md-6 form-group"
				@input="formChanged"
			/>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div v-if="!isNew && person.registered_at == null" class="form-group text-warning">
					<span class="fa fa-exclamation-triangle"/>
					<span>{{ __("Guest Customer") }}</span>
				</div>
			</div>
			<div class="col-md-6 form-group">
				<label class="form-label"> {{ __('Customer Groups') }} </label>
				<div
					v-for="item in forms.options.groups"
					:key="item[0]"
					class="checkbox form-check"
				>
					<label class="form-check-label">
						<input
							v-model="form.groups"
							class="form-check-input"
							type="checkbox"
							name="groups[]"
							:value="item[0]"
							@input="formChanged"
						>
						{{ item[1] }}
					</label>
				</div>
			</div>
		</div>
		<div class="checkbox form-check mb-4">
			<label class="form-check-label">
				<input
					v-model="form.receive_marketing_info"
					class="form-check-input"
					name="receive_marketing_info"
					type="checkbox"
					value="1"
					@input="formChanged"
				>
				{{ __("Subscribed on marketing emails") }}
			</label>
		</div>
		<div
			class="checkbox form-check mb-4"
			v-if="isNew || person.registered_at"
		>
			<label class="form-check-label">
				<input
					v-model="form.send_welcome_email"
					class="form-check-input"
					name="send_welcome_email"
					type="checkbox"
					value="1"
					@input="formChanged"
				>
				<template v-if="isNew">
					{{ __("Send Welcome email with password") }}
				</template>
				<template v-else>
					{{ __("Regenerate password and Send Welcome email") }}
				</template>
			</label>
		</div>
		<div class="form-group">
			<label
				class="form-label"
				for="comment"
			> {{ __("Comment (not visible to customer):") }} </label>
			<textarea
				id="comment"
				v-model="form.comment"
				rows="2"
				name="comment"
				class="form-control"
				@input="formChanged"
			/>
		</div>
	</form>
</template>
<script>
import {mapMutations, mapState} from 'vuex';
import MaskedPhone from '../../../../../../vue/components/MaskedPhone.vue';

export default {
	components: {MaskedPhone},
	props: ['forms'],
	data() {
		return {
			form: this.forms.attrs || {},
		};
	},
	computed: {
		...mapState(['person', 'submitCounter']),
		isNew() {
			return this.person.status === 'draft';
		}
	},
	methods: {
		...mapMutations(['formChanged'])
	},
	watch: {
		submitCounter() {
			this.form.send_welcome_email = null;
		}
	}
};
</script>