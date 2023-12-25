<template>
	<div class="content">
		<div class="top-links mb-4">
			<a :href="url('catalog/admin/feeds/index', grid)">
				<i
					class="fa fa-arrow-left"
					aria-hidden="true"
				/> {{ __('Data feeds') }}
			</a>
		</div>
		<div class="row">
			<div class="col-lg-8 offset-lg-2">
				<form @submit.prevent="submit">
					<input
						v-if="pk"
						type="hidden"
						name="pk"
						:value="pk"
					>
					<div class="form-group">
						<label
							class="form-label"
							for="feed-title"
						>{{ __('Feed title') }} <sup>*</sup></label>
						<input
							id="feed-title"
							v-model="values.title"
							name="title"
							type="text"
							class="form-control"
							required
						>
					</div>
					<div class="form-group">
						<label class="form-label">{{ __('Feed type') }} <sup>*</sup></label>
						<div class="form-group">
							<div class="form-check form-check-inline">
								<label class="form-check-label">
									<input
										v-model="values.type"
										class="form-check-input"
										type="radio"
										name="type"
										value="google-shopping"
									> {{ __('Google shopping') }}
								</label>
							</div>
							<div class="form-check form-check-inline">
								<label class="form-check-label">
									<input
										v-model="values.type"
										class="form-check-input"
										type="radio"
										name="type"
										value="facebook"
										disabled
									> {{ __('Facebook') }}
								</label>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-sm-6 form-group">
							<label class="form-label" for="feed-shop_url">{{ __('Store URL') }} <sup>*</sup></label>
							<input
								id="feed-shop_url"
								v-model="values.shop_url"
								name="shop_url"
								type="text"
								class="form-control"
								required
								placeholder="https://your-shop.com"
							>
						</div>
						<div class="col-sm-6 form-group">
							<label class="form-label" for="feed-product_url_template">{{ __('Product URL template') }} <sup>*</sup></label>
							<input
								id="feed-product_url_template"
								v-model="values.product_url_template"
								name="product_url_template"
								type="text"
								class="form-control"
								required
								placeholder="/product/{product_slug}"
							>
							<div class="form-text">{{__('Specify how URLs to a product page should be generated. There are 2 placeholders available: {product_slug} and {product_id}. The URL is a relative one.')}}</div>
						</div>
					</div>
					<div v-if="values.type == 'google-shopping'"
							 class="row"
					>
						<div class="col-sm-6 form-group">
							<label class="form-label" for="feed-shop_title">{{ __('Store Title') }} <sup>*</sup></label>
							<input
								id="feed-shop_title"
								v-model="values.shop_title"
								name="shop_title"
								type="text"
								class="form-control"
								required
								placeholder="My Brand Shop"
							>
						</div>
						<div class="col-sm-6 form-group">
							<label class="form-label" for="feed-shop_description">{{ __('Store Description') }} <sup>*</sup></label>
							<textarea
								v-model="values.shop_description"
								id="feed-shop_description"
								name="shop_description"
								rows="2"
								class="form-control"
								:placeholder="__('Briefly describe your store')"
								required
							/>
						</div>
					</div>
					<div class="bg-light p-4 mb-3 mt-4">
						<h5 class="mb-3">
							{{ __('Include products in the feed which meet criterias:') }}
						</h5>
						<div class="row">
							<div class="col-sm-6 mb-3">
								<div
									ref="jsTree"
									class="bg-white border h-100"
								/>
							</div>
							<div class="col-sm-6">
								<div class="form-group mb-4">
									<label
										class="form-label"
										for="feed-collection"
									>{{ __('Collection') }}</label>
									<select
										id="feed-collection"
										v-model="values.collection"
										name="collection"
										class="form-select"
									>
										<option
											v-for="(option, i) in options.collection"
											:key="`parent-option-${i}`"
											:value="option[0]"
										>
											{{ option[1] }}
										</option>
									</select>
								</div>
								<div class="form-group mb-4">
									<label
										class="form-label"
										for="manufacturer"
									>{{ __('Manufacturer') }}</label>
									<select
										id="manufacturer"
										v-model="values.manufacturer"
										name="manufacturer"
										class="form-select"
									>
										<option
											v-for="(option, i) in options.manufacturer"
											:key="`parent-option-${i}`"
											:value="option[0]"
										>
											{{ option[1] }}
										</option>
									</select>
								</div>
								<div class="form-group">
									<label
										class="form-label"
										for="commodity_group"
									>{{ __('Product Type') }}</label>
									<select
										id="commodity_group"
										v-model="values.commodity_group"
										name="commodity_group"
										class="form-select"
									>
										<option
											v-for="(option, i) in options.commodityGroup"
											:key="`parent-option-${i}`"
											:value="option[0]"
										>
											{{ option[1] }}
										</option>
									</select>
								</div>
							</div>
						</div>
					</div>
					<div class="checkbox form-check mb-3">
						<label class="form-check-label">
							<input
								v-model="values.is_protected"
								class="form-check-input"
								type="checkbox"
								name="is_protected"
								value="1"
							> {{ __('Protect with password') }}
						</label>
					</div>
					<input
						v-for="categoryId in categories"
						:key="categoryId"
						type="hidden"
						name="categories[]"
						:value="categoryId"
					>
					<div class="text-center">
						<button
							class="btn btn-primary"
							type="submit"
						>
							<i
								class="fa fa-floppy-o"
								aria-hidden="true"
							/>
							{{ __('Save') }}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import $ from 'jquery';

export default {
	name: 'FeedsForm',
	props: ['attrs', 'pk', 'options', 'grid'],
	data() {
		return {
			values: {
				...this.attrs,
				collection: this.attrs.collection || '',
				commodity_group: this.attrs.commodity_group || '',
				manufacturer: this.attrs.manufacturer || '',
				shop_url: this.attrs.shop_url || '',
				product_url_template: this.attrs.product_url_template || '',
				shop_title: this.attrs.shop_title || '',
				shop_description: this.attrs.shop_description || ''
			},
			categories: this.attrs.categories || [],
		};
	},
	async mounted() {
		const [treeRes] = await	Promise.all([
			this.loadTree(),
			this.$bundle('adminUI')
		]);
		const categories = this.categories.map(e => Number(e));
		const mergeWithSelected = (items, selected) => {
			items.forEach(res => {
				const picked = selected.includes(res.data.category_id);
				res.state = {selected: picked};
				if (res.children) {
					mergeWithSelected(res.children, selected);
				}
			});
		};
		const {tree} = treeRes;
		mergeWithSelected(tree, categories);
		this.setupJsTree(tree);
	},
	beforeDestroy() {
		$(this.$refs.jsTree).off('.jstree').jstree('destroy');
	},
	methods: {
		loadTree()  {
			return this.$ajax.get(['catalog/admin/product/category/tree']);
		},
		setupJsTree(data) {
			$(this.$refs.jsTree)
				.on('changed.jstree', (e, data) => {
					this.categories = [];
					data.instance.get_checked(true).forEach((row) => {
						this.categories.push(row.data.category_id);
					});
				})
				.jstree({
					core: {
						data: data,
						check_callback: true,
						themes: {
							ellipsis: true
						},
					},
					plugins: ['wholerow', 'checkbox']
				});
			this.jsTree = $(this.$refs.jsTree).jstree(true);
		},
		submit() {
			this.$form(this.$el).submit(['catalog/admin/feeds/form', {pk: this.pk}]);
		},
	},
};
</script>

<style scoped>

</style>