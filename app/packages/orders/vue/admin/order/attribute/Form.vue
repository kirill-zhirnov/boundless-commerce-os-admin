<template>
	<AttributeForm
		:attrs="attrs"
		:pk="pk"
		:options="options"
		@submit="submit"
		@rmAttr="rmAttr"
	/>
</template>
<script>
import {mapActions, mapMutations} from 'vuex';
import $ from 'jquery';
import AttributeForm from './Form/AttributeForm.vue';


export default {
	components: {AttributeForm},
	props: ['attrs', 'options', 'pk'],
	methods: {
		...mapActions(['removeOrderAttr', 'changeOrderAttr']),
		...mapMutations(['addAttribute']),
		submit() {
			this.$form(this.$el)
				.submit(['orders/admin/order/customAttrs/form', {pk: this.pk}])
				.then(res => {
					if (!res) return;

					if (res.pk) {
						this.changeOrderAttr({pk: this.pk, attribute: res.orderAttr});
					} else {
						this.addAttribute(res.orderAttr);
					}
				});
		},
		rmAttr() {
			if (!confirm(this.__('Are you sure?'))) return;

			this.removeOrderAttr({pk: this.pk, key: this.attrs.key}).then(() =>
				$(this.$el).trigger('close.modal')
			);
		},
	}
};
</script>