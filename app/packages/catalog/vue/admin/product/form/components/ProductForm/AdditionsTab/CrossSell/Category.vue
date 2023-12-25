<template>
	<div class="cross-sell">
		<div class="head">
			<h4> {{ category.title }} </h4>
			<!-- <a
				v-if="help"
				:href="help.url"
				class="small text-muted"
				target="_blank"
			>
				<i class="fa fa-question-circle" /> {{ help.title }} <i class="fa fa-external-link" />
			</a> -->
		</div>
		<ul
			ref="list"
			class="products list-unstyled"
		>
			<li
				v-for="(product, i) in products"
				:key="`cross-prod-${product.product_id}`"
				:data-id="product.product_id"
			>
				<div
					class="img"
					:class="product.thumb ? '' : 'no-image'"
				>
					<img
						v-if="product.thumb"
						:src="product.thumb.s.src"
					>
				</div>
				<a
					:href="url('catalog/admin/product/form', {pk: product.product_id})"
					class="small title"
					target="_blank"
				>
					{{ product.title }}
				</a>
				<div
					v-if="product.price"
					class="price small text-muted"
				>
					<template v-if="Array.isArray(product.price)">
						{{ __('From: %s', [formatMoney(product.price)]) }}
					</template>
					<template v-else>
						{{ formatMoney(product.price) }}
					</template>
				</div>
				<a
					href="#"
					class="rm"
					@click.prevent="rm(product.product_id, i)"
				><i class="fa fa-times" /></a>
				<label class="select">
					<input
						v-model="selected"
						type="checkbox"
						:value="product.product_id"
					>
				</label>
			</li>
			<li class="add">
				<a
					:href="url('catalog/admin/product/crossSell/add', {category: category.alias, product: [productId]})"
					data-modal=""
				>
					<i class="fa fa-plus-circle" />
				</a>
			</li>
		</ul>
		<p
			v-if="products.length"
			class="small"
		>
			<a
				href="#"
				@click.prevent="deleteAll()"
			>
				<i class="fa fa-eraser" /> {{ __('Delete all') }}
			</a>
			<span
				v-if="selected.length"
				class="with-selected"
			>
				{{ __('With selected:') }}
				<a
					href="#"
					class="btn btn-default btn-sm"
					@click="deleteSelected()"
				>
					<i class="fa fa-trash-o" /> {{ __('Delete') }}
				</a>
			</span>
		</p>
	</div>
</template>
<script>
import $ from 'jquery';
import _ from 'underscore';

export default {
	props: ['category', 'productId', 'help'],
	data() {
		return {
			products: [],
			selected: []
		};
	},

	watch: {
		products(val) {
			this.selected = this.selected.filter((productId) => _.findWhere(val, {product_id: productId}));
		}
	},
	mounted() {
		this.load();

		$(document).on('upCrossSell', (e, data) => {
			if (data.category == this.category.category_id) {
				this.load();
			}
		});

		$(this.$refs.list).sortable({
			handle: '.img',
			items: '> li:not(.add)',
			placeholder: 'sortable-placeholder',
			stop: () => {
				let newArr = [],
					sort = []
				;

				$(this.$refs.list).find('li[data-id]').each((e, el) => {
					let id = $(el).data('id');
					newArr.push(_.findWhere(this.products, {product_id: id}));
					sort.push(id);
				});

				this.products = newArr;
				this.$ajax.post(['catalog/admin/product/crossSell/sort'], {
					category: this.category.category_id,
					product: this.productId,
					sort: sort
				}, {hidden: true});
			}
		});
	},

	beforeDestroy() {
		$(document).off('upCrossSell');
	},

	methods: {
		load() {
			this.$ajax.get(['catalog/admin/product/crossSell/products'], {
				category: this.category.category_id,
				product: this.productId
			})
				.then((res) => this.products = res);
		},

		rm(relId, i) {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.products.splice(i, 1);
			this.$ajax.post(['catalog/admin/product/crossSell/rm'], {
				category: this.category.category_id,
				product: this.productId,
				rel: relId
			});
		},

		deleteAll() {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.products = [];
			this.$ajax.post(['catalog/admin/product/crossSell/rmAll'], {
				category: this.category.alias,
				product: [this.productId],
			});
		},

		deleteSelected() {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.products = this.products.filter((row) => !this.selected.includes(row.product_id));

			this.$ajax.post(['catalog/admin/product/crossSell/rm'], {
				category: this.category.category_id,
				product: this.productId,
				rel: this.selected
			});
		}
	}
};
</script>