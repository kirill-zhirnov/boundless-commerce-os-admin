<template>
	<div class="category-form">
		<div class="top-links">
			<a :href="backLink">
				<i class="fa fa-arrow-left" /> {{ __('Categories') }}
			</a>
			<!-- <a
				v-if="status != 'draft'"
				:href="url('@category', {id: pk})"
				target="_blank"
			>
				{{ __('Preview') }} <i class="fa fa-external-link" />
			</a> -->
			<a
				v-if="status != 'draft'"
				:href="url('catalog/admin/category/products/sortModal', {id: pk})"
				data-modal=""
			>
				<i class="fa fa-sort" /> {{ __('Sort products') }}
			</a>
		</div>
		<div class="row">
			<div class="col-sm-8">
				<CategoryForm
					:form="forms.category"
					@submit="execSubmit"
				/>
				<DescriptionForm
					:form="forms.description"
					@submit="execSubmit"
				/>
				<PropsForm
					:form="forms.props"
					@submit="execSubmit"
				/>
				<SeoForm
					:form="forms.seo"
					:routes="{
						compile: 'catalog/admin/category/seo/compile',
						createUrl: 'catalog/admin/category/createUrl'
					}"
					:store-keys="{
						title: 'title'
					}"
					@submit="execSubmit"
				/>
			</div>
			<div class="col-sm-4 col-right">
				<ParentCategoryForm
					:form="forms.parentCategory"
					@submit="execSubmit"
				/>
			</div>
		</div>
		<div class="text-center">
			<div class="btn-group">
				<a
					:href="backLink"
					class="btn btn-outline-secondary"
				>
					<i class="fa fa-arrow-left" /> {{ __('Back') }}
				</a>
				<button
					type="button"
					class="btn btn-primary"
					:disabled="saved ? true : false"
					@click.prevent="execSubmit()"
				>
					<template v-if="saved">
						<i class="fa fa-check" />
						{{ __('Saved') }}
					</template>
					<template v-else>
						<i class="fa fa-floppy-o" />
						{{ __('Save') }}
					</template>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import {mapState, mapMutations} from 'vuex';
import CategoryForm from './Forms/CategoryForm.vue';
import ParentCategoryForm from './Forms/ParentCategoryForm.vue';
import DescriptionForm from './Forms/DescriptionForm.vue';
import SeoForm from '../../../product/form/components/ProductForm/ProductTab/Seo.vue';
import PropsForm from './Forms/PropsForm.vue';

export default {
	components: {
		CategoryForm,
		ParentCategoryForm,
		DescriptionForm,
		SeoForm,
		PropsForm
	},

	props: ['forms', 'grid'],

	data() {
		return {
			pk: this.forms.category.pk,
		};
	},

	computed: {
		backLink() {
			return this.url('catalog/admin/category/index', this.grid);
		},

		...mapState([
			'saved',
			'status'
		])
	},

	beforeMount() {
		let categoryForm = this.forms.category;

		this.setStatus(categoryForm.status);
	},

	methods: {
		execSubmit() {
			this.$formGroup(this.$el).submit(['catalog/admin/category/form/edit', {pk: this.pk}])
				.then((result) => {
					this.setSaved(true);
					this.setStatus(result.status);
				});
		},

		...mapMutations([
			'setSaved',
			'setStatus',
		])
	},
};
</script>