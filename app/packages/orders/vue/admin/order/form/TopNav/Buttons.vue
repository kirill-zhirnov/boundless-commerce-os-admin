<template>
	<div class="btns">
		<a
			:href="url('orders/admin/orders/index', gridParams)"
			class="btn btn-outline-secondary"
		>
			<i
				class="fa fa-arrow-left"
				aria-hidden="true"
			/>
		</a>
		<SaveButton />
	</div>
</template>
<script>
import {mapState} from 'vuex';
import SaveButton from './SaveButton.vue';

export default {
	components: {
		SaveButton
	},
	computed: {
		...mapState([
			'gridParams'
		])
	}
};
</script>