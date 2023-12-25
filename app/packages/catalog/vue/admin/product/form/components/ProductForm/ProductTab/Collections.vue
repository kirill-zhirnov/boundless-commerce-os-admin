<template>
	<form
		name="collections"
		@submit.prevent="$emit('submit')"
	>
		<label> {{ __('Collections') }} </label>

		<div
			v-for="item in collections"
			:key="item.collection_id"
			class="checkbox form-check"
		>
			<label class="form-check-label">
				<input
					v-model="attrs.collection"
					class="form-check-input"
					type="checkbox"
					name="collection[]"
					:value="item.collection_id"
				>
				{{ item.title }}
			</label>
		</div>
		<p>
			<a
				:href="url('catalog/admin/collection/form')"
				class="small"
				data-modal=""
			>
				<i
					aria-hidden="true"
					class="fa fa-plus-circle"
				/> {{ __('Create collection') }}
			</a>
		</p>
	</form>
</template>
<script>
export default {
	props: ['form'],

	data() {
		return {
			attrs: {},
			collections: []
		};
	},

	beforeMount() {
		this.attrs = this.form.attrs;
		this.load();

		$(document).on('success.form.collections', 'form[name="collection"]', () => {
			this.load();
		});
	},

	beforeDestroy() {
		$(document).off('success.form.collections');
	},

	methods: {
		load() {
			this.$ajax.get(this.url('catalog/admin/collection/collection', {perPage: false}))
				.then((result) => {
					this.collections = result[1];
				});
		}
	}
};
</script>