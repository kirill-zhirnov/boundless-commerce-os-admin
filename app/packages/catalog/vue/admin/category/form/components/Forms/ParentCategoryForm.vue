<template>
	<form
		name="parentCategory"
		class="tinted-box"
		@submit.prevent="$emit('submit')"
	>
		<div class="checkbox form-check block">
			<label class="form-check-label">
				<input
					v-model="attrs.is_published"
					type="checkbox"
					class="form-check-input"
					name="is_published"
					value="1"
				>
				{{ __('Category is published') }}
			</label>
		</div>
		<div class="block">
			<input
				v-model="attrs.image_id"
				type="hidden"
				name="image_id"
			>
			<label class="form-label"> {{ __('Image') }} </label>
			<ImageUploader
				:in-val="{
					image: attrs.image,
				}"
				@upVal="setImage"
			/>
		</div>
		<div class="form-group block">
			<label class="form-label"> {{ __('Parent category') }}</label>
			<div ref="jsTree" />
			<input
				v-model="attrs.parent_id"
				type="hidden"
				name="parent_id"
			>
		</div>
	</form>
</template>

<script>
import {mapMutations} from 'vuex';
import ImageUploader from '../../../../../../../cms/vue/image/ImageUploader.vue';
import $ from 'jquery';

export default {
	components: {
		ImageUploader
	},
	props: ['form'],


	data() {
		return {
			attrs: this.form.attrs,
			categories: [],
		};
	},

	watch: {
		attrs: {
			handler: function () {
				this.setSaved(false);
			},
			deep: true
		},

		'attrs.parent_id': function () {
			this.setParentId(this.attrs.parent_id);
		}
	},


	beforeDestroy() {
		$(this.$refs.jsTree).off('.jstree').jstree('destroy');
	},

	mounted() {
		this.setParentId(this.attrs.parent_id);
		this.jsTree = null;

		Promise.all([
			this.loadTree(),
			this.$bundle('adminUI')
		])
			.then((res) => this.setupJsTree(res[0]));
	},

	methods: {
		setupJsTree(data) {
			$(this.$refs.jsTree)
				.on('changed.jstree', (e, data) => {
					data.instance.get_checked(true).forEach((row) => {
						this.attrs.parent_id = row.data.category_id;
					});
				})
				.jstree({
					core: {
						data: data,
						check_callback: false,
						multiple: false,
						themes: {
							name: 'proton',
						},
					},
					checkbox: {
						three_state: false,
					},
					plugins: ['checkbox', 'wholerow']
				});

			this.jsTree = $(this.$refs.jsTree).jstree(true);
		},

		loadTree() {
			return this.$ajax.get(['catalog/admin/category/tree/parent'], {
				parent_id: this.attrs.parent_id
			});
		},

		setImage(value) {
			Object.assign(this.attrs, {image: value.path, image_id: value.image_id});
		},

		...mapMutations([
			'setSaved',
			'setParentId'
		])
	},
};
</script>
