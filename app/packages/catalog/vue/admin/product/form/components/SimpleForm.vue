<template>
	<div>
		<form
			name="product"
			@submit.prevent="submit"
		>
			<input
				type="hidden"
				name="pk"
				:value="pk"
			>
			<div class="form-group">
				<label
					class="form-label"
					for="product_title"
				>
					{{ __('Product title') }} <sup>*</sup>
				</label>
				<input
					id="product_title"
					v-model="attrs.title"
					type="text"
					name="title"
					class="form-control"
					:placeholder="__('Type product title')"
					required
				>
			</div>
			<div class="checkbox form-check">
				<label class="form-check-label">
					<input
						v-model="attrs.is_published"
						type="checkbox"
						class="form-check-input"
						name="is_published"
						value="1"
					>
					{{ __('Product is published') }}
				</label>
			</div>
		</form>
		<Images :product-id="pk" />
		<div class="row">
			<div class="col-sm-6">
				<Category
					:form="forms.categories"
					@submit="submit"
				/>
			</div>
			<div class="col-sm-6">
				<Label
					:form="forms.labels"
					@submit="submit"
				/>
			</div>
		</div>
		<StockAndPrice
			v-if="!hasVariants"
			:form="forms.stockAndPrice"
			:show-prices="!hasVariants"
			@submit="submit"
		/>
		<div class="well well-sm small text-muted">
			<i
				class="fa fa-info-circle"
				aria-hidden="true"
			/>
			{{ __('Manage other properties at') }}
			<a
				:href="url('catalog/admin/product/form', {pk: pk})"
				target="_blank"
			>
				{{ __('product form') }}
				<i
					class="fa fa-external-link"
					aria-hidden="true"
				/>
			</a>
		</div>
		<div class="text-center">
			<button
				type="button"
				class="btn btn-primary"
				@click.prevent="submit"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/>
				{{ __('Save') }}
			</button>
		</div>
	</div>
</template>
<script>
import {mapMutations, mapState} from 'vuex';

import Category from './ProductForm/ProductTab/Category.vue';
import Label from './ProductForm/ProductTab/Label.vue';
import Images from './ProductForm/ProductTab/Images.vue';
import StockAndPrice from './ProductForm/ProductTab/StockAndPrice.vue';

export default {
	components: {
		Category,
		Label,
		Images,
		StockAndPrice
	},

	props: ['forms'],

	data() {
		return {
			attrs: this.forms.product.attrs,
			pk: this.forms.product.pk
		};
	},

	computed: {
		...mapState([
			'hasVariants'
		])
	},

	beforeMount() {
		let product = this.forms.product;
		this.setCommodityGroup(product.commodityGroup);
		this.setHasVariants(product.hasVariants);
	},

	methods: {
		submit() {
			this.$formGroup(this.$el).submit(['catalog/admin/product/simple/form', {collection: this.forms.product.collectionId}]);
		},

		...mapMutations([
			'setCommodityGroup',
			'setHasVariants',
		])
	},
};
</script>