<template>
	<div class="color-wrapper">
		<div class="container-wrapper">
			<div class="title-row">
				<div
					class="img-wrapper"
					:class="img ? '' : 'no-img'"
					:style="img ? {'background-image': `url(${img.thumb.xs.src})`} : ''"
				/>
				<div class="title">
					<span
						v-if="productTitle"
						class="product"
					>
						{{ productTitle }}
					</span>
					<span
						v-else
						class="empty"
					>
						{{ docTitle }}
					</span>
				</div>
				<transition enter-active-class="animated shake">
					<Buttons v-if="tabWithErr.length > 0" />
				</transition>
				<Buttons v-if="!tabWithErr.length" />
			</div>
			<ProductTabs />
		</div>
	</div>
</template>
<script>
import {mapState} from 'vuex';
import ProductTabs from './ProductTabs.vue';
import Buttons from './TopNav/Buttons.vue';

export default {
	components: {
		Buttons,
		ProductTabs,
	},

	computed: {
		docTitle() {
			return this.status == 'draft'
				? this.__('Creation new product')
				: this.__('Edit product')
			;
		},

		...mapState([
			'productTitle',
			'saved',
			'tabWithErr',
			'img',
			'status'
		])
	},
};
</script>