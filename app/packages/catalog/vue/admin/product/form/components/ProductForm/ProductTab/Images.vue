<template>
	<div
		class="product-images tinted-box"
		:class="!images.length ? 'empty' : ''"
	>
		<label> {{ __("Images") }} </label>
		<p
			v-if="!images.length"
			class="empty-icon text-muted"
		>
			<i
				class="fa fa-picture-o"
				aria-hidden="true"
			/>
		</p>
		<p :class="images.length ? 'small' : 'intro'">
			{{ __("Drop images here to upload or ") }}
			<a
				ref="clickToUpload"
				href="#"
				@click.prevent=""
			>
				<i
					class="fa fa-cloud-upload"
					aria-hidden="true"
				/>
				{{ __("click here") }} </a>.
		</p>
		<ul
			ref="list"
			class="list-unstyled clearfix"
		>
			<li
				v-for="(image, i) in images"
				:key="`img-${image.product_image_id}`"
				:data-id="image.product_image_id"
				class="image-tag-container"
			>
				<img :src="image.thumb.m.src">
				<div class="overlay">
					<a
						v-if="allowEdit"
						:href="
							url('catalog/admin/product/image/form', {
								pk: image.product_image_id,
							})
						"
						data-modal=""
					>
						<i
							class="fa fa-pencil"
							aria-hidden="true"
						/>
					</a>
					<a
						href="#"
						@click.prevent="rmImg(image.product_image_id, i)"
					>
						<i
							class="fa fa-trash-o"
							aria-hidden="true"
						/>
					</a>
				</div>
				<div
					v-if="image.tags"
					class="image-tag-list"
				>
					<div
						v-for="tag in image.tags.slice(0, i === 0 ? 7 : 4)"
						:key="`tag-${tag.image_tag_id}`"
						:class="{ large: i === 0 }"
						:data-id="tag.image_tag_id"
						class="image-tag-list__tag"
					>
						{{ tag.title }}
					</div>
				</div>
			</li>
		</ul>
		<div class="landing">
			{{ __("Drop files here") }}
		</div>
	</div>
</template>
<script>
import DropzoneWrapper from '../../../../../../../../cms/widgets/dropzoneWrapper.client';
import $ from 'jquery';
import {mapMutations} from 'vuex';

export default {
	props: ['productId', 'allowEdit'],

	data() {
		return {
			images: []
		};
	},

	watch: {
		images(val) {
			this.setImg(val[0] || null);
		}
	},

	beforeMount() {
		this.imgByKeys = {};
		this.load();

		this.listenTo$(document, 'success.form', '.product-img-form', () => {
			this.upVariantsUpdated();
			this.load();
		});
	},

	mounted() {
		this.dz = new DropzoneWrapper(
			this.$el,
			this.url('catalog/admin/product/image/upload', {
				product: this.productId
			}),
			{
				maxFiles: null,
				clickable: this.$refs.clickToUpload,
				onQueueCompleteHook: () => {
					this.load();
				}
			}
		);

		// $(document).on('success.form', '.product-img-form', () => {
		//   this.load();
		// });

		$(this.$refs.list).sortable({
			placeholder: 'sortable-placeholder',
			stop: () => {
				let newArr = [],
					sort = [];
				$(this.$refs.list)
					.find('li')
					.each((e, el) => {
						let id = $(el).data('id');
						newArr.push(this.imgByKeys[id]);
						sort.push(id);
					});

				this.images = newArr;
				this.$ajax.post(
					['catalog/admin/product/image/saveSort'],
					{
						product: this.productId,
						sort: sort
					},
					{hidden: true}
				);
			}
		});
	},

	beforeDestroy() {
		let $list = $(this.$refs.list);
		if ($list.sortable('instance')) {
			$list.sortable('destroy');
		}

		this.dz.remove();
	},

	methods: {
		load() {
			this.$ajax
				.get(this.url('catalog/admin/product/image/list'), {
					product: this.productId
				})
				.then(res => {
					this.images = res;

					this.imgByKeys = {};
					res.forEach(row => {
						this.imgByKeys[row.product_image_id] = row;
					});
				});
		},

		rmImg(productImageId, position) {
			if (!confirm(this.__('Are you sure?'))) return;

			this.images.splice(position, 1);
			this.$ajax.post(this.url('catalog/admin/product/image/rm'), {
				pk: productImageId
			});
		},

		...mapMutations(['setImg', 'upVariantsUpdated'])
	},
};
</script>