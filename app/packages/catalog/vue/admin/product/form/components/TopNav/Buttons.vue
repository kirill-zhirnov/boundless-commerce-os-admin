<template>
	<div class="btns">
		<a :href="url('catalog/admin/product/index', gridParams)"
			 class="btn btn-outline-secondary"
		>
			<i class="fa fa-arrow-left" aria-hidden="true"></i>
		</a>
		<SaveButton></SaveButton>
	</div>
</template>
<script>
import {mapState} from 'vuex';
import SaveButton from './SaveButton.vue';

export default {
	data() {
		return {};
	},

	computed: {
		...mapState([
			'gridParams'
		])
	},

	components: {
		SaveButton
	}
};
</script>