<template>
	<form
		class="create-multiple-variants"
		@submit.prevent="submit"
	>
		<!-- <p class="text-end">
			<a
				:href="help.url"
				class="text-muted small"
				target="_blank"
			>
				<i class="fa fa-question-circle" /> {{ help.title }} <i class="fa fa-external-link" />
			</a>
		</p> -->
		<div class="centered-wrapper">
			<ul class="list-unstyled characteristics">
				<li
					v-for="(characteristic, i) in characteristics"
					:key="characteristic.characteristic_id"
					:class="characteristic.relatedTo"
				>
					<input
						type="hidden"
						:name="`id[c_${i}]`"
						:value="characteristic.characteristic_id"
					>
					<input
						type="hidden"
						:name="`relatedTo[c_${i}]`"
						:value="characteristic.relatedTo"
					>

					<template v-if="characteristic.relatedTo == 'group'">
						<div class="title">
							<div class="checkbox form-check">
								<label class="form-check-label">
									<input
										v-model="characteristics[i].isUsed"
										class="form-check-input"
										:name="`is_used[c_${i}]`"
										value="1"
										type="checkbox"
										:tabindex="characteristic.tabIndex"
									> {{ characteristic.title }}
								</label>
							</div>
						</div>
						<ul class="small cases">
							<li
								v-for="(caseItem, j) in characteristic.cases"
								:key="caseItem.id"
							>
								{{ caseItem.title }}

								<input
									type="hidden"
									:name="`case_id[c_${i}][j_${j}]`"
									:value="caseItem.id"
								>
							</li>
						</ul>
					</template>
					<template v-else>
						<input
							:name="`is_used[c_${i}]`"
							value="1"
							type="hidden"
						>

						<div class="title">
							<div class="form-group">
								<input
									v-model="characteristics[i].title"
									type="text"
									:name="`title[c_${i}]`"
									class="form-control"
									:placeholder="attributePlaceholder(i)"
									:tabindex="characteristic.tabIndex"
									@keydown.13.prevent=""
								>
							</div>
						</div>
						<div class="cases">
							<div
								v-for="(caseRow, j) in characteristic.cases"
								:key="characteristics[i].cases[j].id"
								class="form-group case-row"
							>
								<input
									type="hidden"
									:name="`case_id[c_${i}][j_${j}]`"
									:value="characteristics[i].cases[j].id"
								>
								<input
									v-model="characteristics[i].cases[j].title"
									type="text"
									:name="`case_title[c_${i}][j_${j}]`"
									class="form-control"
									:placeholder="casePlaceholder(i, j)"
									:tabindex="caseRow.tabIndex"
									@keydown.13.prevent=""
								>
								<button
									type="button"
									class="btn btn-outline-secondary close"
									@click.prevent="characteristic.cases.splice(j, 1)"
								>
									<i
										class="fa fa-trash-o"
										aria-hidden="true"
									/>
								</button>
							</div>
							<a
								href="#"
								class="small text-muted"
								@click.prevent="addEmptyCase(i)"
							>
								{{ __('Add value') }}
							</a>
						</div>
						<button
							class="btn btn-sm close"
							type="button"
							@click.prevent="characteristics.splice(i, 1)"
						>
							<span aria-hidden="true">×</span>
						</button>
					</template>
				</li>
			</ul>
			<a
				href="#"
				class="btn btn-secondary btn-sm mb-2"
				@click.prevent="addEmpty()"
			>
				<i
					class="fa fa-plus"
					aria-hidden="true"
				/>
				{{ __('Add attribute') }}
			</a>
		</div>
		<Variants
			v-show="forVariants.length"
			:for-variants="forVariants"
		/>
	</form>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import Variants from './CreateMultipleVariantsForm/Variants.vue';
import $ from 'jquery';

export default {
	components: {
		Variants
	},

	props: [
		'groupCharacteristics',
		'product',
		'productCharacteristics',
		'groupId',
		'help'
	],

	data() {
		return {
			characteristics: []
		};
	},

	computed: {
		forVariants() {
			let out = [];
			this.characteristics.forEach((row, i) => {
				let item = Object.assign(this.$clear(row), {
					index: i
				});

				if (row.relatedTo == 'group') {
					if (!row.isUsed)
						return;
				} else {
					if ($.trim(item.title) == '')
						return;

					item.cases = item.cases.filter((caseRow) => {
						if ($.trim(caseRow.title) != '')
							return true;

						return false;
					});

					if (!item.cases.length)
						return;
				}

				let color = this.getCharactColor(out.length);
				item.cases = item.cases.map((caseRow, j) => {
					caseRow.localId = `case_${i}_${j}`;
					caseRow.color = color;

					return caseRow;
				});

				out.push(item);
			});

			return out;
		},

		...mapState([
			'characteristicValues'
		])
	},

	beforeMount() {
		this.tabIndex = 100;
		this.makeCharacteristics();

		this.placeholders = {
			even: {
				attr: this.__('Color'),
				cases: [this.__('Red'), this.__('Green')]
			},

			odd: {
				attr: this.__('Size'),
				cases: ['S', 'M', 'L', 'XL']
			}
		};
	},

	methods: {
		addEmpty() {
			this.characteristics.push({
				characteristic_id: null,
				title: '',
				relatedTo: 'product',
				cases: [
					{id: null, title: ''},
					{id: null, title: ''}
				]
			});
			this.setupTabIndexes();
		},

		addEmptyCase(i) {
			this.characteristics[i].cases.push({id: null, title:''});
			this.setupTabIndexes();
		},

		attributePlaceholder(i) {
			let key = (i % 2 == 0) ? 'even' : 'odd';
			return this.placeholders[key].attr;
		},

		casePlaceholder(i, j) {
			let key = (i % 2 == 0) ? 'even' : 'odd';

			if (this.placeholders[key].cases[j])
				return this.placeholders[key].cases[j];

			return '';
		},

		makeCharacteristics() {
			let out = [];
			this.groupCharacteristics.forEach((row) => {
				let item = this.$clear(row);
				item.isUsed = (row.used_in_variants) ? true : false;

				let checkedValue = this.characteristicValues[row.characteristic_id] || [];
				item.cases = item.cases.filter((caseRow) => {
					return checkedValue.indexOf(caseRow.id) != -1;
				});

				if (item.cases.length > 0)
					out.push(item);
			});

			this.characteristics = out.concat(this.$clear(this.productCharacteristics));
			this.addEmpty();
		},

		setupTabIndexes() {
			this.characteristics.forEach((row) => {
				row.tabIndex = this.tabIndex++;

				row.cases.forEach((caseRow) => {
					caseRow.tabIndex = this.tabIndex++;
				});
			});
		},

		getCharactColor(index) {
			let colors = ['#3c7661', '#337ec9', '#ab4442', '#8d6d3b', '#317096'];

			if (index in colors)
				return colors[index];

			return null;
		},

		submit() {
			this.$form(this.$el).submit(['catalog/admin/product/variant/createMulti', {product: this.product.product_id, group: this.groupId}])
				.then(() => this.upVariantsUpdated());
		},

		...mapMutations([
			'upVariantsUpdated'
		])
	},
};
</script>