<template>
	<form
		name="props"
		@submit.prevent="$emit('submit')"
	>
		<div class="row">
			<div class="col-sm-6">
				<div class="form-group">
					<label class="form-label"> {{ __('Menu') }} </label>
					<div class="checkbox form-check">
						<label class="form-check-label">
							<input
								v-model="attrs.display_in_menu"
								class="form-check-input"
								type="checkbox"
								name="display_in_menu"
								value="1"
							> {{ __('Display in menu') }}
						</label>
					</div>
				</div>
				<div v-show="attrs.display_in_menu == '1'">
					<div class="form-group">
						<div class="checkbox form-check">
							<label class="form-check-label">
								<input
									v-model="attrs.link_from_menu"
									class="form-check-input"
									type="checkbox"
									name="link_from_menu"
									value="1"
								> {{ __('Link from menu item') }}
							</label>
						</div>
					</div>
					<div
						v-show="attrs.link_from_menu == '1' && attrs.display_in_menu == '1'"
						class="form-group"
					>
						<input
							v-model="attrs.custom_link"
							type="text"
							name="custom_link"
							class="form-control"
							placeholder="http://your-link.com"
						>
					</div>
				</div>
			</div>
			<div class="col-sm-6">
				<div
					v-show="mightHaveProducts"
					class="checkbox form-check"
				>
					<label class="form-check-label">
						<input
							v-model="attrs.show_filters"
							class="form-check-input"
							type="checkbox"
							name="show_filters"
							value="1"
						><i class="fa fa-filter" /> {{ p__('catForm', 'Show filters') }}
					</label>
				</div>
				<div v-show="mightHaveProducts && attrs.show_filters">
					<a
						v-show="!showFiltersList"
						href="#"
						class="small"
						@click.prevent="showFiltersList = true"
					>
						<i class="fa fa-caret-right" /> {{ __('Specify filter') }}
					</a>
					<div v-show="showFiltersList">
						<div class="form-group">
							<label class="form-label">{{ __('Filter') }}</label>
							<select
								v-model="attrs.filter_id"
								class="form-select"
								name="filter_id"
							>
								<option
									v-for="option in form.options.filter"
									:key="option[0]"
									:value="option[0]"
								>
									{{ option[1] }}
								</option>
							</select>
						</div>
						<p class="small text-end">
							<a
								:href="url('catalog/admin/filter/index')"
								target="_blank"
							>
								{{ __('Setup filters') }} <i class="fa fa-external-link" />
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	</form>
</template>

<script>
import {mapMutations, mapState} from 'vuex';

export default {
	props: ['form'],

	data() {
		return {
			attrs: this.form.attrs,
			showFiltersList: null,
		};
	},

	computed: {
		mightHaveProducts() {
			return !['subCategories', 'subCategoriesNoLeftMenu'].includes(this.attrs.sub_category_policy);
		},

		...mapState([
			'parentId',
		])
	},

	watch: {
		attrs: {
			handler: function () {
				this.setSaved(false);
			},
			deep: true
		}
	},

	beforeMount() {
		this.showFiltersList = (this.attrs.filter_id == '') ? false : true;
	},

	methods: {
		...mapMutations([
			'setSaved',
		])
	},
};
</script>