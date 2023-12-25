<template>
	<div>
		<form
			class=""
			@submit.prevent="submit"
		>
			<div class="form-group">
				<label
					class="form-label"
					for="app-name"
				>{{ __("Application name") }} <sup>*</sup></label>
				<input
					id="app-name"
					v-model="values.name"
					name="name"
					type="text"
					class="form-control"
				>
			</div>
			<div class="form-group">
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							v-model="values.can_manage"
							class="form-check-input"
							type="checkbox"
							name="can_manage"
							value="1"
						>
						{{ __('Token has Management rights and Can read sensitive data') }}
					</label>
				</div>
				<div v-if="values.can_manage == '1'" class="form-text text-danger">
					{{ __('Don\'t share token with the management\'s rights.') }}
				</div>
			</div>
			<div class="row">
				<div class="col-sm-6">
					<div class="form-group">
						<label
							class="form-label"
							for="client-id"
						>{{ __("Client ID") }}</label>
						<input
							id="client-id"
							v-model="values.client_id"
							name="client_id"
							type="text"
							class="form-control"
							readonly
						>
					</div>
				</div>
				<div class="col-sm-6">
					<div class="form-group">
						<label
							class="form-label"
							for="secret"
						>{{ __("Secret") }}</label>
						<input
							id="secret"
							v-model="values.secret"
							name="secret"
							type="text"
							class="form-control"
							readonly
						>
					</div>
				</div>
			</div>
			<div
				v-if="values.permanent_token"
				class="form-group"
			>
				<label
					class="form-label"
					for="permanent-token"
				>{{ __("Permanent token") }}</label>
				<input
					id="permanent-token"
					v-model="values.permanent_token"
					name="permanent_token"
					type="text"
					class="form-control"
					readonly
				>
			</div>
			<input
				:value="pk"
				name="pk"
				type="hidden"
			>
			<div
				v-if="values.permanent_token"
				class="text-end"
			>
				<button
					class="btn btn-outline-secondary btn-sm"
					type="button"
					@click="revokeToken"
				>
					{{ __("Revoke permanent token") }}
				</button>
			</div>
			<div class="row">
				<div class="col-sm-6">
					<div class="form-group">
						<label
							class="form-label"
						>{{ __("Instance ID") }}</label>
						<input
							type="text"
							class="form-control"
							:value="instanceId"
							readonly
						>
					</div>
				</div>
			</div>
			<div class="text-center">
				<button
					class="btn btn-primary"
					type="submit"
				>
					<span class="glyphicon glyphicon-floppy-saved" />
					{{ " " }}
					{{ __("Save") }}
				</button>
			</div>
		</form>
		<h5 class="mt-5 mb-3">How to use tokens?</h5>
		<h6>Using permanent token:</h6>
		<div class="bg-light p-2 rounded border">
			<pre><code>// install client: yarn add boundless-api-client

import {BoundlessClient} from 'boundless-api-client';
const apiClient = new BoundlessClient('&lt;YOUR PERMANENT TOKEN&gt;');
apiClient.setInstanceId('&lt;YOUR INSTANCE ID&gt;');

//fetch products:
apiClient.catalog.getProducts().then(data => console.log(data));</code></pre>
		</div>
		<h6 class="mt-5">Generate token (for server-side requests - more secure way):</h6>
		<div class="bg-light p-2 rounded border"><pre><code>// install client: yarn add boundless-api-client jsonwebtoken

import {BoundlessClient} from 'boundless-api-client';
import {generateBoundlessToken} from 'boundless-api-client/token';

const token = generateBoundlessToken('&lt;YOUR CLIENT ID&gt;', '&lt;YOUR SECRET&gt;', '&lt;YOUR INSTANCE ID&gt;');
const apiClient = new BoundlessClient(token);
apiClient.setInstanceId('&lt;YOUR INSTANCE ID&gt;');

//fetch products:
apiClient.catalog.getProducts().then(data => console.log(data));</code></pre></div>
	</div>
</template>

<script>
import $ from 'jquery';

export default {
	props: ['token', 'pk', 'submit'],

	data() {
		return {
			values: this.token || {},
			instanceId: ''
		};
	},

	computed: {},

	beforeMount() {},

	mounted() {
		this.instanceId = this.getRegistry().instanceInfo.instance_id;
	},

	methods: {
		async revokeToken() {
			const res = await this.$ajax.get([
				'auth/admin/token/revoke',
				{
					id: [this.pk]
				}
			]);
			if (res) {
				$('body').trigger('refresh.grid');
				$(this.$el).trigger('close.modal');
			}
		}
	}
};
</script>