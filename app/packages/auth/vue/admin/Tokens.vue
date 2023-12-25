<template>
	<div>
		<TokenCreate v-if="view === 'create'" v-bind:submit="submit"/>
		<TokenEdit v-if="view === 'edit'" v-bind:token="attrs" :pk="pk" :submit="submit"/>
	</div>
</template>

<script>
import TokenCreate from './tokens/TokenCreate.vue';
import TokenEdit from './tokens/TokenEdit.vue';

export default {
	props: ['options', 'attrs', 'pk', 'scenario'],

	data() {
		return {
			view: this.pk ? 'edit' : 'create',
		};
	},

	beforeMount() {
	},

	methods: {
		submit() {
			this.$form(this.$el).submit(['auth/admin/token/form']);
		}
	},

	components: {
		TokenCreate,
		TokenEdit
	},

	computed: {}
};
</script>