<template>
	<div class="variants-tab">
		<Variants
			:forms="forms"
		/>
		<div class="row">
			<div class="col-sm-8">
				<Size
					:form="forms.size"
					@submit="$emit('submit')"
				/>
				<GroupAndCharacteristics
					:forms="forms"
					@submit="$emit('submit')"
				/>
			</div>
			<div class="col-sm-4">
				<Props
					:form="forms.props"
					@submit="$emit('submit')"
				/>
			</div>
		</div>
	</div>
</template>
<script>
import GroupAndCharacteristics from './VariantsTab/GroupAndCharacteristics.vue';
import Variants from './VariantsTab/Variants.vue';
import Size from './VariantsTab/Size.vue';
import Props from './VariantsTab/Props.vue';

export default {
	components: {
		GroupAndCharacteristics,
		Variants,
		Size,
		Props
	},

	props: ['forms'],
};
</script>