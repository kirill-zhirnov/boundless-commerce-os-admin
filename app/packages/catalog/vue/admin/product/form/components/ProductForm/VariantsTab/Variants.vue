<template>
	<div
		v-if="loaded"
		class="variants"
		:class="hasVariants ? 'has-variants' : ''"
	>
		<p class="top-lnks">
			<!--v-if="!hasVariants"-->
			<a
				:href="url('catalog/admin/product/variant/createMulti', {product: forms.product.pk, group: commodityGroup.groupId})"
				style="font-size:18px"
				data-modal=""
			>
				<i
					class="fa fa-plus-circle"
					aria-hidden="true"
				/>
				{{ __('Create variants') }}
			</a>

			<!-- <a
				:href="forms.product.help.whatIsVariant.url"
				class="help text-muted small"
				target="_blank"
			>
				<i class="fa fa-question-circle" /> {{ forms.product.help.whatIsVariant.title }} <i class="fa fa-external-link" />
			</a> -->
		</p>
		<div
			v-if="variants.length"
			class="variants-row row justify-content-center"
		>
			<div :class="getVariantsColSize()">
				<div class="table-responsive">
					<table class="table table-striped table-hover">
						<thead>
							<tr>
								<th class="col-checkbox">
									<label>
										<input
											v-model="selectAll"
											name="variant_all"
											type="checkbox"
											value="1"
										>
									</label>
								</th>
								<th />
								<th
									v-for="characteristic in characteristics"
									:key="characteristic.id"
								>
									{{ characteristic.title }}
								</th>
								<th> {{ __('Price') }} </th>
								<th>
									{{ __('Stock') }}
								</th>
								<th> {{ __('Sku') }} </th>
								<th />
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="variant in variants"
								:key="variant.variant_id"
							>
								<td class="col-checkbox">
									<label>
										<input
											v-model="selected"
											name="variant[]"
											type="checkbox"
											:value="variant.variant_id"
										>
									</label>
								</td>
								<td class="col-image">
									<img
										v-if="variant.default_image"
										:src="getUrl(variant.default_image)"
										alt="Variant default image"
									>
								</td>
								<td
									v-for="characteristic in characteristics"
									:key="characteristic.id"
								>
									<a
										v-if="(`${variant.variant_id}-${characteristic.id}` in intersections) && intersections[`${variant.variant_id}-${characteristic.id}`]"
										v-bind="charactCellAttrs(variant, characteristic)"
									>
										{{ intersections[`${variant.variant_id}-${characteristic.id}`].title }}
									</a>
								</td>
								<td class="col-price">
									<EditPrice
										v-if="editPrice == variant.variant_id"
										:variant="variant"
										@exit="editPrice = null"
										@saved="Object.assign(variant, $event);editPrice = null;"
									/>
									<a
										v-else
										href="#"
										class="as-inp"
										@click.prevent="editPrice = variant.variant_id;editQty = null;"
									>
										<div
											v-if="variant.price"
											class="price"
										>
											{{ formatMoney(variant.price) }}
										</div>
										<div
											v-if="variant.price_old"
											class="price-old"
										>
											{{ formatMoney(variant.price_old) }}
										</div>
									</a>
								</td>
								<td class="col-stock">
									<template v-if="trackInventory">
										<EditQty
											v-if="editQty == variant.variant_id"
											:variant="variant"
											@exit="editQty = null"
											@saved="Object.assign(variant, $event);editQty = null;"
										/>
										<a
											v-else
											href="#"
											class="as-inp"
											@click.prevent="editQty = variant.variant_id;editPrice = null;"
										>
											{{ variant.available_qty }}
											<div
												v-if="variant.reserved_qty"
												class="reserved"
											>
												{{ __('Reserved:') }}
												{{ variant.reserved_qty }}
											</div>
										</a>
									</template>
									<div v-else>
										<span :class="variant.available_qty ? 'label label-success':'label label-default'">
											{{ variant.available_qty ? __('In stock') : __('Out of stock') }}
										</span>
									</div>
								</td>
								<td class="col-sku">
									{{ variant.sku }}
								</td>
								<td class="col-btns">
									<div
										class="btn-group btn-group-sm"
										role="group"
									>
										<a
											:href="getVariantUrl(variant)"
											class="btn btn-outline-secondary btn-sm"
											data-modal=""
										>
											{{ __('Edit') }}
										</a>
										<a
											href="#"
											class="btn btn-outline-secondary btn-sm"
											@click.prevent="rmSelected([variant.variant_id])"
										>
											<i
												class="fa fa-trash"
												aria-hidden="true"
											/>
										</a>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p
					v-if="selected.length"
					class="text-muted"
				>
					{{ __('With selected:') }}
					<a
						href="#"
						class="btn btn-outline-secondary btn-sm"
						@click.prevent="rmSelected()"
					>
						<i
							class="fa fa-trash-o"
							aria-hidden="true"
						/>
						{{ __('Remove') }}
					</a>
					<a
						:href="url('catalog/admin/product/variant/multi/setPrice', {pk: selected})"
						class="btn btn-outline-secondary btn-sm"
						data-modal=""
					>
						<i
							class="fa fa-usd"
							aria-hidden="true"
						/>
						{{ __('Set prices') }}
					</a>
					<a
						v-if="trackInventory"
						:href="url('catalog/admin/product/variant/multi/setQty', {pk: selected})"
						class="btn btn-outline-secondary btn-sm"
						data-modal=""
					>
						<i
							class="fa fa-battery-quarter"
							aria-hidden="true"
						/>
						{{ __('Set stock') }}
					</a>
				</p>
			</div>
		</div>
	</div>
</template>
<script>
import {mapState, mapMutations} from 'vuex';
import EditPrice from './Variants/EditPrice.vue';
import EditQty from './Variants/EditQty.vue';
import _ from 'underscore';
import {getImgCloudUrl} from '../../../../../../../../../modules/s3Storage/cloudUrl';

export default {
	components: {
		EditPrice,
		EditQty
	},

	props: ['forms'],

	data() {
		return {
			loaded: false,
			characteristics: null,
			idCombinations: null,
			variants: null,
			selected: [],
			selectAll: false,
			editPrice: null,
			editQty: null
		};
	},

	computed: {
		intersections() {
			let out = {};
			if (Array.isArray(this.variants) && Array.isArray(this.characteristics)) {
				this.variants.forEach((variant) => {
					this.characteristics.forEach((characteristic) => {
						out[`${variant.variant_id}-${characteristic.id}`] = this.getCaseIntersection(
							variant.variant_id,
							characteristic.id
						);
					});
				});
			}

			return out;
		},

		colors() {
			let i = 0,
				colors = ['#3c7661', '#337ec9', '#763eaf', '#ff9517', '#ab4442', '#8d6d3b', '#317096'],
				out = {}
			;


			this.characteristics.forEach((characteristic) => {
				characteristic.cases.forEach((caseRow) => {
					if (colors[i]) {
						out[`${characteristic.id}.${caseRow.id}`] = colors[i];
					}

					i++;
				});
			});

			return out;
		},

		trackInventory() {
			return this.commodityGroup.trackInventory.value;
		},

		...mapState([
			'commodityGroup',
			'hasVariants',
			'variantsUpdated',
			'tab'
		])
	},

	watch: {
		variantsUpdated() {
			this.loadVariants();
		},

		tab() {
			if (this.loaded || this.tab != 'variants')
				return;

			this.loadVariants();
		},

		selectAll(val) {
			this.selected = [];

			if (val) {
				this.selected = _.pluck(this.variants, 'variant_id');
			}
		}
	},

	methods: {
		loadVariants() {
			this.$ajax.post(this.url('catalog/admin/product/variant/list'), {
				product: this.forms.product.pk
			})
				.then((result) => {
					this.loaded = true;

					({
						characteristics: this.characteristics,
						idCombinations: this.idCombinations,
						variants: this.variants
					} = result);

					this.setHasVariants(
						(this.variants.length > 0) ? true : false
					);
				});
		},

		getCaseIntersection(variantId, characteristicId) {
			if (
				(variantId in this.idCombinations)
				&&
				(characteristicId in this.idCombinations[variantId])
			) {
				let characteristic = this.characteristics.find((row) => {
					return row.id == characteristicId;
				});

				if (characteristic) {
					return characteristic.cases.find((row) => {
						return row.id == this.idCombinations[variantId][characteristicId];
					});
				}
			}

			return null;
		},

		rmSelected(id = null) {
			if (!confirm(this.__('Are you sure?')))
				return;

			this.$ajax.post(this.url('catalog/admin/product/variant/rm'), {
				id: id || this.selected,
				product: this.forms.product.pk
			})
				.then(() => {
					if (!id)
						this.selected = [];

					this.loadVariants();
				});
		},

		getVariantsColSize() {
			switch (this.characteristics.length) {
			case 1:
				return 'col-md-10';
			// case 2:
			// case 3:
			// 	return 'col-md-10 offset-md-1';
			default:
				return 'col-md-12';
			}
		},

		getVariantUrl(variant) {
			return this.url('catalog/admin/product/variant/form', {pk: variant.variant_id});
		},

		charactCellAttrs(variant, characteristic) {
			let out = {
				href: this.getVariantUrl(variant),
				'data-modal': ''
			};

			let caseRow = this.intersections[`${variant.variant_id}-${characteristic.id}`];

			if (caseRow) {
				let colorKey = `${characteristic.id}.${caseRow.id}`;

				if (this.colors[colorKey])
					out.style = `color: ${this.colors[colorKey]}`;
			} else {
				console.log(variant.variant_id, characteristic.id);
			}

			return out;
		},

		onPriceSaved() {
			this.editPrice = null;
		},

		getUrl(url) {
			return getImgCloudUrl(url, 75);
		},

		...mapMutations([
			'setHasVariants'
		])
	},
};
</script>