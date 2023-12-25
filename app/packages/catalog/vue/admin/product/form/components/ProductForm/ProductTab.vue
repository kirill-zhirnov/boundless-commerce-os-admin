<template>
	<div class="product-tab">
		<div class="row">
			<div class="col-sm-8">
				<form
					name="product"
					@submit.prevent="$emit('submit')"
				>
					<input
						type="hidden"
						name="pk"
						:value="form.pk"
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
							class="form-control input-lg"
							:placeholder="__('Type product title')"
							required
						>
					</div>
					<div class="form-group">
						<textarea
							ref="desc"
							v-model="attrs.description"
							name="description"
							class="form-control"
							rows="3"
						/>
					</div>
					<div class="form-group">
						<label
							class="form-label"
							for="product_sku"
						>{{ __('SKU') }}</label>
						<div class="input-group">
							<span class="input-group-text">
								<i
									class="fa fa-barcode"
									aria-hidden="true"
								/>
							</span>
							<input
								id="product_sku"
								v-model="attrs.sku"
								type="text"
								class="form-control"
								name="sku"
							>
						</div>
					</div>
					<!--need to have submit button to allow submit by enter-->
					<button
						type="submit"
						class="d-none"
					/>
				</form>
				<StockAndPriceForSingle
					v-if="!hasVariants || (forms.stockAndPrice.availableQty > 0 && trackInventory && status !== 'draft')"
					:form="forms.stockAndPrice"
					:show-prices="!hasVariants"
					@submit="$emit('submit')"
				/>
				<div
					v-if="hasVariants"
					class="well well-sm form-block"
				>
					<div class="text-muted small">
						<i
							aria-hidden="true"
							class="fa fa-info-circle"
						/>
						{{ __('Since product has variants stock and prices should be managed in tab') }}
						<a
							href="#"
							@click.prevent="tab('variants')"
						>
							{{ __('Variants and options') }}
						</a>
					</div>
				</div>
				<Tax :form="forms.tax" />
				<Images
					:product-id="form.pk"
					:allow-edit="true"
				/>
				<Seo :form="forms.seo" />
			</div>
			<div class="col-sm-4 col-right">
				<div class="tinted-box">
					<Category
						:form="forms.categories"
						@submit="$emit('submit')"
					/>
					<Label
						:form="forms.labels"
						:show-edit="true"
						@submit="$emit('submit')"
					/>
					<Collections
						:form="forms.collections"
						@submit="$emit('submit')"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import Category from './ProductTab/Category.vue';
import StockAndPriceForSingle from './ProductTab/StockAndPrice.vue';
import Label from './ProductTab/Label.vue';
import Collections from './ProductTab/Collections.vue';
import Images from './ProductTab/Images.vue';
import Seo from './ProductTab/Seo.vue';
import Tax from './ProductTab/Tax.vue';
import $ from 'jquery';

import {mapState, mapMutations} from 'vuex';

export default {
	components: {
		Category,
		StockAndPriceForSingle,
		Label,
		Collections,
		Images,
		Seo,
		Tax
	},

	props: ['forms'],

	data() {
		return {
			attrs: {},
			form: this.forms.product
		};
	},
	computed: {
		...mapState([
			'hasVariants',
			'trackInventory',
			'status'
		])
	},

	watch: {
		'attrs.title': function () {
			this.$store.commit('title', this.attrs.title);
		}
	},

	beforeMount() {
		//DON't remove it! on other cases watch for attrs.title won't fire!
		this.attrs = this.form.attrs;
	},

	mounted() {
		$(this.$refs.desc).wysiwyg({config: {toolbarFixedTopOffset: 90}});
	},

	beforeDestroy() {
		$(this.$refs.desc).wysiwyg('rm');
	},

	methods: {
		...mapMutations([
			'tab'
		])
	}
};
</script>