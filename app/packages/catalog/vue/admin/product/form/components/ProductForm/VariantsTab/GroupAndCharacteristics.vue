<template>
	<form
		v-if="loaded"
		name="characteristics"
		@submit.prevent="$emit('submit')"
	>
		<GroupForm
			:pk="pk"
			:attrs="attrs"
			:group="groupAttrs"
			:options="options.group"
			@groupChanged="loadCharacteristics"
		/>
		<template v-if="tree && commodityGroup && commodityGroup.groupId">
			<Characteristics
				v-for="(group, i) in tree"
				:key="`characteristics-${i}`"
				v-model="characteristicValues"
				:group="group"
				:group-id="commodityGroup.groupId"
				:product-id="pk"
			/>
		</template>
		<p class="add-prop-row">
			<a
				v-if="attrs.group_id && attrs.group_id != 'create'"
				:href="url('catalog/admin/commodityGroup/characteristic/quickForm', {groupId: attrs.group_id, productId: pk})"
				data-modal=""
			>
				<i
					class="fa fa-plus-circle"
					aria-hidden="true"
				/>
				{{ __('Add Attribute') }}
			</a>
			<!-- <a
				:href="help.addProp.url"
				target="_blank"
				class="small text-muted"
			>
				<i class="fa fa-question-circle" /> {{ help.addProp.title }} <i class="fa fa-external-link" />
			</a> -->
		</p>
		<div class="small text-muted">
			{{ __('Add the new attribute: Color, Size, etc.') }}
			<a href="https://help.boundless-commerce.com/books/user-guide/page/creating-and-entering-your-own-characteristics" target="_blank" class="text-muted">
				{{ __('Read more in Help Center') }}
			</a>
		</div>
		<!--need to have submit button to allow submit by enter-->
		<button
			type="submit"
			class="d-none"
		/>
	</form>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import Characteristics from './GroupAndCharacteristics/Characteristics.vue';
import GroupForm from './GroupAndCharacteristics/GroupForm.vue';
import $ from 'jquery';

export default {
	components: {
		Characteristics,
		GroupForm
	},

	props: ['forms'],

	data() {
		return {
			loaded: false,
			options: {},
			attrs: {},
			tree: null,
			// size: null,
			characteristicValues: null,
			help: null,
			groupAttrs: {}
		};
	},

	computed: {
		pk() {
			return this.forms.product.pk;
		},

		...mapState([
			'tab',
			'commodityGroup'
		])
	},

	watch: {
		tab() {
			if (this.loaded || this.tab != 'variants')
				return;

			this.loadForm();
		},

		characteristicValues(val) {
			this.setCharacteristicValues(val);
		}
	},

	beforeDestroy() {
		$(document).off('.gac');
	},

	mounted() {
		$(document).on('success.form.gac', '.characteristic-form', (e, data) => {
			let oldScroll = $(window).scrollTop();
			//update only tree
			this.tree = null;
			this.$nextTick()
				.then(() => {
					this.tree = data.characteristics.tree;
					return this.$nextTick();
				})
				.then(() => {
					$(window).scrollTop(oldScroll);
				});
		});

		this.setTrackInventory(this.forms.stockAndPrice.trackInventory);
	},

	methods: {
		loadForm() {
			this.$ajax.get(['catalog/admin/product/characteristic/form'], {
				pk: this.pk
			})
				.then((result) => {
					this.loaded = true;

					this.options = result.options;
					this.attrs = result.attrs;
					this.groupAttrs = result.characteristics.group;

					this.help = result.help;
					this.setupCharacteristics(result.characteristics);
				});
		},

		loadCharacteristics(groupId) {
			this.$ajax.post(['catalog/admin/product/characteristic/onGroupChange'], {
				pk: this.pk,
				group_id: groupId
			})
				.then((result) => {
					this.attrs.group_id = groupId;
					this.setupCharacteristics(result.characteristics);
					this.setCommodityGroup(result.commodityGroup);
					if (result.commodityGroup?.trackInventory)
						this.setTrackInventory(result.commodityGroup?.trackInventory.value);
				});
		},

		setupCharacteristics(resCharacteristics, makeValues = true) {
			this.tree = null;

			if (!resCharacteristics)
				return;

			return this.$nextTick()
				.then(() => {
					if (makeValues) {
						this.makeCharacteristicValues(resCharacteristics.tree);
					}

					this.tree = resCharacteristics.tree;
				});
		},

		makeCharacteristicValues(tree) {
			this.characteristicValues = {};

			let arr = [].concat(this.$clear(tree));
			// arr.push({children: _.values(this.$clear(size).children)});

			arr.forEach((value) => {
				value.children.forEach((row) => {
					this.characteristicValues[row.characteristic_id] = row.value;
				});
			});
		},

		...mapMutations([
			'setCommodityGroup',
			'setCharacteristicValues',
			'setTrackInventory'
		])
	},
};
</script>