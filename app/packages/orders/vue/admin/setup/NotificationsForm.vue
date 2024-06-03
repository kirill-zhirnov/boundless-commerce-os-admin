<template>
	<form
		class="email-notifications-form"
		@submit.prevent="submit"
	>
		<div class="form-wrapper">
			<p class="d-flex mb-3 align-items-center flex-wrap" style="gap: 20px">
				<a
					:href="url('orders/admin/setup/notification/form')"
					data-modal=""
					class="btn custom-btn custom-btn_purple-100"
				>
					<i
						class="fa fa-plus"
						aria-hidden="true"
					/> {{ ' ' }}
					{{ __('Create notification') }}
				</a>
				<a href="https://help.boundless-commerce.com/books/user-guide/page/order-email-notifications-for-customers"
					 target="_blank"
					 class="ms-auto"
				>
					{{ __('How to Customise Notifications?') }}
				</a>
			</p>
			<p
				v-if="!templates || !templates.length"
				class="text-center"
			>
				{{ __('You don\'t have any active notifications.') }}
			</p>
			<div v-else>
				<h4>{{ __('Notify customer when:') }}</h4>
				<table class="table table-striped table-bordered backgrid w-100">
					<thead>
						<tr>
							<th style="width: 200px;">
								{{ __('Conditions') }}
							</th>
							<th>{{ __('Email notification') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="template, i in templates"
							:key="template.template_id"
						>
							<td
								class="text-center"
								:style="`background-color: #${template.background_color}; `"
							>
								<template v-if="template.event_type == 'created'">
									Order created
								</template>
								<template v-else-if="template.event_type == 'updated'">
									Order updated,<br/>
									Status: {{ template.status_title }}
								</template>
							</td>
							<td>
								<div class="form-group">
									<label
										class="form-label"
										:for="`subject-${template.template_id}`"
									>{{ __('Subject') }}</label>
									<input
										:id="`subject-${template.template_id}`"
										v-model="template.subject"
										class="form-control"
										:name="'subjects[' + template.template_id + 'id]'"
									>
								</div>

								<div class="form-group status-template-list">
									<label
										class="form-label"
										:for="`template-${template.template_id}`"
									>{{ __('Body') }}</label>
									<textarea
										:id="`template-${template.template_id}`"
										v-model="template.template"
										class="template"
										:name="'templates[' + template.template_id + 'id]'"
									/>
								</div>
								<div class="text-end">
									<a
										href="#"
										@click.prevent="rm(template.template_id, i)"
									>{{ __('Delete') }}</a>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
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
			</div>
		</div>
	</form>
</template>

<script>
import $ from 'jquery';

export default {
	props: ['attrs'],
	data() {
		return {
			templates: [],
			codeMirrors: [],
			CodeMirror: null
		};
	},
	beforeMount() {
		this.listenTo$(document, 'success.form', '.email-notification-form', () => {
			this.fetchTemplates();
		});
	},
	mounted() {
		this.$bundle('adminUI').then(() => {
			this.CodeMirror = require('codemirror');
			require('codemirror/addon/mode/simple');
			require('codemirror/mode/handlebars/handlebars');
			require('codemirror/mode/htmlmixed/htmlmixed');

			this.fetchTemplates();
			// this.$nextTick(this.setupCodemirror);
		});
	},
	beforeDestroy() {
		this.unsetCodemirror();
	},
	methods: {
		fetchTemplates() {
			this.codeMirrors.forEach((el, i) => {
				this.templates[i].template = el.getValue();
			});

			this.$ajax.get(['orders/admin/setup/notification/list'])
				.then(data => {
					this.unsetCodemirror();
					this.templates = data.map(template => {
						const prevTemplate = this.templates.find(el => el.template_id === template.template_id);
						return prevTemplate || template;
					});
					this.$nextTick(this.setupCodemirror);
				});
		},
		unsetCodemirror() {
			this.codeMirrors.forEach(cm => cm.toTextArea());
		},
		setupCodemirror() {
			this.codeMirrors = [];
			$(this.$el).find('.status-template-list .template').each((i, el) => {
				if (!this.CodeMirror) return;
				const cm = this.CodeMirror.fromTextArea(el, {
					mode: {name: 'handlebars', base: 'text/html'},
					// lineWrapping: true,
					// viewportMargin: Infinity
				});

				cm.on('change', () => {
					cm.save();
				});

				this.codeMirrors.push(cm);
			});
		},
		submit() {
			this.$form(this.$el).submit(['orders/admin/setup/notification/settings']);
		},
		rm(id, i) {
			if (!confirm(this.__('Are you sure?'))) return;

			this.$ajax.post(['orders/admin/setup/notification/rm'], {id})
				.then(() => {
					this.codeMirrors[i].toTextArea();
					this.templates.splice(i, 1);
					this.codeMirrors.splice(i, 1);
				});
		}
	}
};
</script>