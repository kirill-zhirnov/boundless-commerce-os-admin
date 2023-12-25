<template>
	<div class="content">
		<div class="top-links">
			<a :href="url('catalog/admin/product/index', grid)">
				<i
					class="fa fa-arrow-left"
					aria-hidden="true"
				/> {{ __('Products') }}
			</a>
<!--			<a-->
<!--				:href="url('@product', {id: pk})"-->
<!--				target="_blank"-->
<!--			>-->
<!--				{{ __('Preview') }} <i-->
<!--					class="fa fa-external-link"-->
<!--					aria-hidden="true"-->
<!--				/>-->
<!--			</a>-->
			<a
				:href="url('catalog/admin/product/copy', {pk: pk})"
				target="_blank"
			>
				{{ __('Duplicate') }} <i
					class="fa fa-files-o"
					aria-hidden="true"
				/>
			</a>
			<a
				v-if="status !== 'draft'"
				:href="url('catalog/admin/product/toBasket', {product: pk})"
			>
				{{ __('Add to Cart') }} <i
					class="fa fa-shopping-cart"
					aria-hidden="true"
				/>
			</a>
			<a
				:href="url('catalog/admin/productQtyHistory/modal', {product_id: pk})"
				data-modal=""
			>
				{{ __('History of changes in stock qty') }} <i
					class="fa fa-history"
					aria-hidden="true"
				/>
			</a>
			<!-- <a
				:href="help.form.url"
				target="_blank"
				class="help"
			>
				<i class="fa fa-question-circle" /> {{ help.form.title }} <i class="fa fa-external-link" />
			</a> -->
		</div>
		<div class="tabs-body">
			<ProductTab
				v-show="tab == 'product'"
				:forms="forms"
				@submit="execSubmit"
			/>
			<VariantsTab
				v-show="tab == 'variants'"
				:forms="forms"
				@submit="execSubmit"
			/>
			<AdditionsTab
				v-show="tab == 'additions'"
				:forms="forms"
				@submit="execSubmit"
			/>
		</div>
		<div class="footer-btns text-center">
			<SaveButton />
		</div>
	</div>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import _ from 'underscore';
import ProductTab from './ProductForm/ProductTab.vue';
import VariantsTab from './ProductForm/VariantsTab.vue';
import AdditionsTab from './ProductForm/AdditionsTab.vue';
import SaveButton from './TopNav/SaveButton.vue';

export default {
	components: {
		ProductTab,
		VariantsTab,
		AdditionsTab,
		SaveButton,
	},
	props: ['forms', 'grid'],
	data() {
		return {
			pk: this.forms.product.pk,
			help: this.forms.product.help,
			hasVariants: this.forms.product.hasVariants
		};
	},
	computed: {
		...mapState([
			'tab',
			'submit',
			'status'
		])
	},
	watch: {
		submit() {
			this.execSubmit();
		},
	},
	beforeMount() {
		let product = this.forms.product;
		this.setCommodityGroup(product.commodityGroup);
		this.setHasVariants(product.hasVariants);
		this.setStatus(product.status);
		this.setGridParams(this.grid);
	},
	methods: {
		execSubmit() {
			this.setLoading(true);
			this.setTabWithErr([]);
			this.$formGroup(this.$el).submit(['catalog/admin/product/form', {pk: this.pk}])
				.then((result) => {
					this.setLoading(false);
					this.setSaved(true);
					this.setStatus(result.status);
				})
				.catch((res) => {
					this.setLoading(false);

					this.setTabWithErr(
						this.getTabsByForms(Object.keys(res.forms))
					);
				});
		},
		getTabsByForms(forms) {
			let out = [];
			forms.forEach((formName) => {
				switch (formName) {
				case 'product':
				case 'categories':
				case 'stockAndPrice':
				case 'labels':
				case 'collections':
				case 'seo':
					out.push('product');
					break;

				case 'size':
				case 'characteristics':
				case 'props':
					out.push('variants');
					break;

				case 'yml':
					out.push('additions');
					break;
				}
			});

			out = _.uniq(out);

			return out;
		},
		...mapMutations([
			'setLoading',
			'setTabWithErr',
			'setCommodityGroup',
			'setSaved',
			'setHasVariants',
			'setStatus',
			'setGridParams'
		])
	},
};
</script>