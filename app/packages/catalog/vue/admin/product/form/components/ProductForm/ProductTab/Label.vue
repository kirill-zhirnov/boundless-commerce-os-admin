<template>
	<form
		name="labels"
		@submit.prevent="$emit('submit')"
	>
		<label> {{ __('Labels') }} </label>
		<ul class="product-tag-form-list">
			<li
				v-for="label in labels"
				:key="label.label_id"
			>
				<div class="checkbox form-check">
					<label class="form-check-label">
						<input
							v-model="attrs.label"
							class="form-check-input"
							type="checkbox"
							name="label[]"
							:value="label.label_id"
						>
						<div
							class="product-tag"
							:style="`color:${label.text_color}; background-color:${label.color}`"
						>
							<span
								:class="`fa fa-${label.icon}`"
								aria-hidden="true"
							/>
							{{ label.title }}
						</div>
					</label>
					<a
						v-if="showEdit"
						:href="getFormUrl(label.label_id)"
						class="edit"
						data-modal=""
					>
						<i
							aria-hidden="true"
							class="fa fa-pencil"
						/>
					</a>
				</div>
			</li>
			<li v-if="showEdit">
				<a
					:href="getFormUrl()"
					data-modal=""
					class="small"
				>
					<i
						class="fa fa-tag"
						aria-hidden="true"
					/>
					{{ __('Create new label') }}
				</a>
			</li>
		</ul>
	</form>
</template>
<script>
import $ from 'jquery';

export default {
	props: ['form', 'showEdit'],

	data() {
		return {
			attrs: {},
			labels: []
		};
	},

	beforeMount() {
		this.attrs = this.form.attrs;
		this.load();

		$(document).on('success.form.labels', 'form.labels-form', () => {
			this.load();
		});
	},

	beforeDestroy() {
		$(document).off('success.form.labels');
	},

	methods: {
		load() {
			this.$ajax.get(this.url('catalog/admin/label/collection', {perPage: false}))
				.then((result) => {
					this.labels = result[1];
				});
		},

		getFormUrl(pk = null) {
			let params = pk ? {pk: pk} : {};

			return this.url('catalog/admin/label/form', params);
		}
	}
};
</script>