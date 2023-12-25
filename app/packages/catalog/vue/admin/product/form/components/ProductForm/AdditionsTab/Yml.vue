<template>
	<form name="yml">
		<h4>Yandex.market</h4>
		<div
			v-if="!commodityGroup.ymlExport"
			v-html="bs().alert('warning', 'Exporting to YML is disabled in commodity group settings.')"
		/>
		<div v-show="commodityGroup.ymlExport">
			<div class="checkbox">
				<label>
					<input
						v-model="attrs.yml_export"
						type="checkbox"
						name="yml_export"
						value="1"
					>
					{{ p__('yml', 'Export to Yandex.market') }}
				</label>
			</div>
			<div
				v-show="attrs.yml_export == '1'"
				class="row"
			>
				<div class="col-sm-6">
					<div class="form-group">
						<label for="yml_model"> {{ p__('yml', 'Model') }} </label>
						<input
							id="yml_model"
							v-model="attrs.model"
							type="text"
							name="model"
							class="form-control"
							maxlength="255"
						>
					</div>
					<div class="form-group">
						<label for="yml_sales_notes"> {{ p__('yml', 'Sales notes') }} </label>
						<textarea
							id="yml_sales_notes"
							v-model="attrs.sales_notes"
							type="text"
							name="sales_notes"
							class="form-control"
							maxlength="50"
						/>
						<p class="form-text small">
							{{ p__('yml', 'It uses to specify additional information e.g.: minimal order, discounts, etc.') }}
						</p>
					</div>
					<div class="form-group">
						<label for="yml_age"> {{ p__('yml', 'Product age group') }} </label>
						<select
							id="yml_age"
							v-model="attrs.age"
							name="age"
							class="form-control"
						>
							<option
								v-for="option in form.options.age"
								:value="option[0]"
							>
								{{ option[1] }}
							</option>
						</select>
					</div>
					<div class="checkbox">
						<label>
							<input
								v-model="attrs.adult"
								type="checkbox"
								name="adult"
								value="1"
							>
							{{ p__('yml', 'Adult') }}
						</label>
					</div>
					<div class="checkbox">
						<label>
							<input
								v-model="attrs.manufacturer_warranty"
								type="checkbox"
								name="manufacturer_warranty"
								value="1"
							>
							{{ p__('yml', 'Manufacturer warranty') }}
						</label>
					</div>
					<div class="checkbox">
						<label>
							<input
								v-model="attrs.seller_warranty"
								type="checkbox"
								name="seller_warranty"
								value="1"
							>
							{{ p__('yml', 'Seller warranty') }}
						</label>
					</div>
				</div>
				<div class="col-sm-6">
					<div class="form-group">
						<label for="yml_vendor_code"> {{ p__('yml', 'Vendor code') }} </label>
						<input
							id="yml_vendor_code"
							v-model="attrs.vendor_code"
							type="text"
							name="vendor_code"
							class="form-control"
							maxlength="255"
						>
						<p class="form-text small">
							{{ p__('yml', 'By default it will be taken from the SKU field. Fill only if you want to redefine it.') }}
						</p>
					</div>
					<div class="form-group">
						<label for="yml_title"> {{ p__('yml', 'Title') }} </label>
						<input
							id="yml_title"
							v-model="attrs.title"
							type="text"
							name="title"
							class="form-control"
						>
						<p class="form-text small">
							{{
								p__('yml', 'By default it will be taken from the product title. Fill only if you want to redefine it.')
							}}
						</p>
					</div>
					<div class="form-group">
						<label for="yml_description"> {{ p__('yml', 'Description') }} </label>
						<textarea
							id="yml_description"
							v-model="attrs.description"
							type="text"
							name="description"
							class="form-control"
						/>
						<p class="form-text small">
							{{
								p__('yml', 'By default it will be taken from the product description. Fill only if you want to redefine it.')
							}}
						</p>
					</div>
				</div>
			</div>
		</div>
	</form>
</template>
<script>
import {mapState} from 'vuex';

export default {
	props: ['form'],

	data() {
		return {
			attrs: {}
		};
	},

	beforeMount() {
		this.attrs = this.form.attrs;
	},

	computed: {
		...mapState([
			'commodityGroup'
		])
	}
};
</script>
