<template>
	<div>
		<CrossSellCategory v-for="category,i in categories"
						   :key="`cross-${category.category_id}`"
						   :category="category"
						   :productId="forms.product.pk"
						   :help="(i == 0) ? help : null"
		></CrossSellCategory>
	</div>
</template>
<script>
	import CrossSellCategory from './CrossSell/Category.vue';

	export default {
		props: ['forms'],

		data() {
			return {
				categories: [],
				help: null
			}
		},

		mounted() {
			this.$ajax.get(['catalog/admin/product/crossSell/categories'])
				.then((res) => {
					this.help = res.help;
					this.categories = res.categories;
				});
		},

		components: {
			CrossSellCategory
		}
	}
</script>