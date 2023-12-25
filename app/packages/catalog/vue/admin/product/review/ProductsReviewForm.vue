<template>
	<form
		class="order-leave-review"
		@submit.prevent="submit"
	>
		<div class="form-group">
			<label
				class="form-label"
				for="review-name"
			>{{ p__('review', 'Name') }} <sup>*</sup></label>
			<input
				id="review-name"
				v-model="values.name"
				name="name"
				type="text"
				class="form-control"
			>
		</div>
		<div class="form-group">
			<label
				class="form-label"
				for="review-product"
			>{{ __('Product') }} <sup>*</sup></label>
			<div class="input-group">
				<div class="input-group-text">
					<i class="fa fa-search" />
				</div>
				<input
					id="review-product"
					ref="productSearch"
					name="name"
					type="text"
					class="form-control"
					:placeholder="__('Type product name')"
				>
			</div>
		</div>
	</form>
</template>

<script>
import {convertResponse, highlight} from '../../../../../system/modules/autocomplete.client';
import gHtml from '../../../../../../modules/gHtml/index.client';

export default {
	props: ['formData'],
	data() {
		return {
			values: this.formData.attrs,
			images: this.formData.images,
			product: null
		};
	},

	mounted() {
		this.dz = {};
		this.$bundle('clientUI').then(() => {
			$(this.$refs.productSearch).autocomplete({
				minChars: 2,
				forceFixPosition: true,
				onSelect: (selected) => {
					console.log('selected', selected);
					// let value = _.pick(selected.data, ['id', 'url']);
					// value.title = selected.data.value;
					//
					// this.$emit('linkSet', value);
				},
				lookup: (suggestion, callback) => {
					this.$ajax.get(['orders/admin/orderItems/autocomplete'], {q: suggestion})
						.then((data) => {
							callback(
								convertResponse(suggestion, data)
							);
						});
				},
				formatResult: (suggestion, search) => {
					let out = '';
					if (suggestion.data.thumb)
						out += gHtml.img(suggestion.data.thumb);

					let text = highlight(search, suggestion.value);
					if (suggestion.data.comment)
						text += gHtml.tag('div', {class: 'comment'}, suggestion.data.comment);

					out += gHtml.tag('section', {}, text);

					return out;
				}
			});

			const DropzoneWrapper = require('../../../../../cms/widgets/dropzoneWrapper.client');

			// this.productReviews.forEach(({review}) => {
			// 	$(this.$refs[`rating${review.review_id}`]).rateYo({
			// 		rating: this.values.rating[review.review_id] || 0,
			// 		ratedFill: '#ffd000',
			// 		fullStar: true,
			// 		spacing: "5px",
			// 		onSet: (val) => {
			// 			this.values.rating[review.review_id] = val;
			// 		}
			// 	});
			//
			// 	this.dz[review.review_id] = new DropzoneWrapper(this.$refs[`dz${review.review_id}`][0], this.url('orders/review/uploadImg', {review: review.review_id}), {
			// 		successMessage: false,
			// 		onSuccessHook: (file, response) => review.productReviewImgs = response.d
			// 	});
			// });

		});
	},

	methods: {
		submit() {
			this.$form(this.$el).submit(['catalog/admin/product/reviews/form', {pk: this.formData.pk}]);
		}
	}
};
</script>