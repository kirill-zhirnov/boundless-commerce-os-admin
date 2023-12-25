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
import AttributeForm from '../../../../orders/vue/admin/order/attribute/Form/AttributeForm.vue';

export default {
	components: {AttributeForm},
	props: ['attrs', 'options', 'pk'],
	methods: {
		...mapActions(['removeAttr', 'changeAttr']),
		...mapMutations(['addAttribute']),
		submit() {
			this.$form(this.$el)
				.submit(['customer/admin/customAttrs/form', {pk: this.pk}])
				.then(res => {
					if (!res) return;
					if (res.pk) {
						this.changeAttr({pk: this.pk, attribute: res.personAttr});
					} else {
						this.addAttribute(res.personAttr);
					}
				});
		},
		rmAttr() {
			if (!confirm(this.__('Are you sure?'))) return;
			this.removeAttr({pk: this.pk, key: this.attrs.key}).then(() =>
				$(this.$el).trigger('close.modal')
			);
		},
	}
};
</script>