<template>
	<div class="row">
		<div class="col-md-6">
			<div class="form-group">
				<label
					class="form-label"
					for="manufacturer_title"
				>
					{{ __("Title") }}
				</label>
				<input
					id="manufacturer_title"
					v-model="form.title"
					type="text"
					name="title"
					class="form-control"
				>
			</div>
		</div>
		<div class="col-md-6">
			<div class="form-group">
				<label
					class="form-label"
					for="url_key"
				>
					{{ __("Url key") }}
				</label>
				<div class="input-group form-inline">
					<span class="input-group-text">{{ url("@brand", { id: "" }, true) }}</span>{{ " " }}
					<input
						id="url_key"
						v-model="form.url_key"
						type="text"
						name="url_key"
						class="form-control"
						@change="handleChange"
					>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import _ from 'underscore';

export default {
	props: ['attrs', 'pk'],

	data() {
		return {
			generateUrl: true,
			form: this.attrs
		};
	},

	watch: {
		'form.title': function() {
			if (this.generateUrl && this.form.title) {
				this.createUrl(this.form.title);
			}
			if (!this.form.title && this.generateUrl) {
				this.form.url_key = '';
			}
		}
	},

	beforeMount() {
		this.createUrl = _.debounce(title => {
			this.$ajax
				.get(
					'/catalog/admin/manufacturer/createUrl',
					{
						title: title,
						pk: this.pk
					},
					{hidden: true}
				)
				.then(result => {
					if (this.form.title) {
						this.form.url_key = result.url;
					}
				});
		}, 200);
	},
	methods: {
		handleChange: function() {
			this.generateUrl = false;
		}
	}
};
</script>
