<template>
	<ul class="summary-adding list-unstyled">
		<li
			v-for="item in flatList"
			:key="item.key"
		>
			<span class="title">{{ item.title }}</span> - <span class="qty">{{ item.qty }} pcs.</span>
			<a
				href="#"
				@click.prevent="onRmClicked(item)"
			><i
				class="fa fa-times"
				aria-hidden="true"
			/></a>
		</li>
	</ul>
</template>
<script>
export default {
	props: ['forAddingOnlyWithQty'],
	computed: {
		flatList() {
			const out = [];
			this.forAddingOnlyWithQty.forEach(({product_id, has_variants, title, qty, variants}) => {
				if (has_variants && Array.isArray(variants)) {
					variants.forEach(({variant_id, title: variant_title, qty}) => {
						out.push({
							product_id,
							variant_id,
							title: `${title} - ${variant_title}`,
							qty,
							type: 'variant',
							key: `${product_id}-${variant_id}`
						});
					});
				} else {
					out.push({
						product_id,
						title,
						qty,
						type: 'product',
						key: product_id
					});
				}
			});
			return out;
		}
	},
	methods: {
		onRmClicked(item) {
			this.$emit('rmItem', item);
		}
	}
};
</script>