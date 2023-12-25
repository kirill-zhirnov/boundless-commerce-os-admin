<template>
	<div class="commodity-group-block">
		<h4>{{ __('Product type') }}</h4>
		<div class="form-group">
			<div v-if="groupId != 'create'">
				<div
					v-if="editMode"
					ref="changeGroupForm"
				>
					<div class="d-flex">
						<select
							id="product_group_id"
							v-model="groupId"
							name="group_id"
							class="form-select"
						>
							<option
								v-for="row in groupOptions"
								:key="row[0]"
								:value="row[0]"
							>
								{{ row[1] }}
							</option>
						</select>
						<a
							class="btn btn-primary ms-2"
							href="#"
							:disabled="groupId === attrs.group_id"
							@click.prevent="submitGroup"
						>
							{{ __('Save') }}
						</a>
					</div>
					<div class="text-right">
						<a
							href="#"
							class="small"
							@click.prevent="editMode = false"
						>{{ __('Cancel') }}</a>
					</div>
				</div>
				<div v-else>
					<span>{{ groupTitle }}</span>
					<span class="ml-3">
						<a
							href="#"
							@click.prevent="editMode = true"
						>
							{{ __('Change') }}
						</a>
					</span>
				</div>
			</div>
			<div
				v-else
				ref="createGroupForm"
			>
				<div class="input-group input-group-sm">
					<input
						ref="groupTitle"
						type="text"
						name="group_title"
						class="form-control"
						:placeholder="__('Title')"
						@keydown.13.prevent="submitCreateGroupForm"
					>
					<button
						class="btn btn-outline-secondary"
						href="#"
						@click.prevent="submitCreateGroupForm"
					>
						<i
							class="fa fa-plus-circle"
							aria-hidden="true"
						/>
						{{ __('Create a Product Type') }}
					</button>
				</div>
				<div class="text-right">
					<a
						href="#"
						class="small"
						@click.prevent="groupId = prevGroupId"
					>{{ __('Cancel') }}</a>
				</div>
			</div>
		</div>
		<div class="form-text small">{{ __('Product Type is a classification of goods that share similar attributes.')}}</div>
	</div>
</template>

<script>
import {mapMutations} from 'vuex';
export default {
	props: ['attrs', 'options', 'pk', 'group'],
	data() {
		return {
			editMode: false,
			groupId: this.attrs.group_id,
			prevGroupId: null,
			groupOptions: this.options,
		};
	},
	computed: {
		groupTitle() {
			let title = '';
			if (this.groupId === this.group.group_id && this.group.commodityGroupTexts.length) {
				title = this.group.commodityGroupTexts[0].title || '';
			}

			return title || this.groupOptions.find(el => Number(el[0]) === this.groupId)[1];
		}
	},
	watch: {
		groupId(val, prevVal) {
			if (val === 'create') {
				this.prevGroupId = prevVal;

				this.$nextTick(() => {
					this.$refs.groupTitle.focus();
				});
			}
		},
		editMode() {
			this.groupId = this.attrs.group_id;
		},
		'attrs.group_id'(val) {
			this.groupId = val;
		}
	},
	methods: {
		...mapMutations(['upVariantsUpdated']),
		submitCreateGroupForm() {
			this.$form(this.$refs.createGroupForm).submit(['catalog/admin/commodityGroup/quickEdit', {createOption: 1}])
				.then((result) => {
					this.groupId = result.pk;
					this.groupOptions = result.options;
					this.$ajax.post(['catalog/admin/product/changeGroup', {pk: this.pk}], {group_id: this.groupId})
						.then(() => this.groupChanged());
				});
		},
		submitGroup() {
			this.$form(this.$refs.changeGroupForm).submit(['catalog/admin/product/changeGroup', {pk: this.pk}])
				.then(() => this.groupChanged());
		},
		groupChanged() {
			this.$emit('groupChanged', this.groupId);
			this.editMode = false;
			this.upVariantsUpdated();
		}
	}
};
</script>