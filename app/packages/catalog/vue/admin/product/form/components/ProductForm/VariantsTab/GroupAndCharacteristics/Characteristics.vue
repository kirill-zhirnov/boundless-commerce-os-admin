<template>
	<div class="charact-block tinted-box">
		<h4 v-if="group.title">
			{{ group.title }}
		</h4>
		<div
			v-for="item in children"
			:key="item.characteristic_id"
			class="form-group"
		>
			<label class="form-label">
				{{ item.title }}
				<a
					:href="url('catalog/admin/commodityGroup/characteristic/quickForm', {
						pk: item.characteristic_id,
						groupId: groupId,
						productId: productId
					})"
					data-modal=""
					class="edit"
				>
					<i
						class="fa fa-pencil"
						aria-hidden="true"
					/>
				</a>
			</label>
			<input
				v-if="item.type =='text'"
				v-bind="getInputAttrs(item)"
				type="text"
				:value="value[item.characteristic_id]"
				@input="upValue(item.characteristic_id, item.type, $event)"
			>
			<select
				v-else-if="item.type =='select'"
				v-bind="getInputAttrs(item)"
				@input="upValue(item.characteristic_id, item.type, $event)"
			>
				<option
					v-for="caseVal in item.cases"
					:key="caseVal[0]"
					:value="caseVal[0]"
					:selected="value[item.characteristic_id] == caseVal[0]"
				>
					{{ caseVal[1] }}
				</option>
			</select>
			<textarea
				v-else-if="item.type =='textarea'"
				v-bind="getInputAttrs(item)"
				:value="value[item.characteristic_id]"
				@input="upValue(item.characteristic_id, item.type, $event)"
			/>
			<template v-else-if="item.type =='radio'">
				<div
					v-for="caseVal in item.cases"
					:key="caseVal[0]"
					class="radio form-check"
				>
					<label class="form-check-label">
						<input
							class="form-check-input"
							type="radio"
							v-bind="getInputAttrs(item)"
							:value="caseVal[0]"
							:checked="value[item.characteristic_id] == caseVal[0]"
							@input="upValue(item.characteristic_id, item.type, $event)"
						>
						{{ caseVal[1] }}
					</label>
				</div>
			</template>
			<template v-else-if="item.type =='checkbox'">
				<div
					v-for="caseVal in item.cases"
					:key="caseVal[0]"
					class="checkbox form-check"
				>
					<label class="form-check-label">
						<input
							class="form-check-input"
							type="checkbox"
							v-bind="getInputAttrs(item)"
							:value="caseVal[0]"
							:checked="isChecked(value[item.characteristic_id], caseVal[0])"
							@input="upValue(item.characteristic_id, item.type, $event)"
						>
						{{ caseVal[1] }}
					</label>
				</div>
			</template>
			<Wysiwyg v-else-if="item.type =='wysiwyg'"
							 classes="form-control"
							 :name="`characteristic[${item.characteristic_id}]`"
							 :value="value[item.characteristic_id]"
							 @input="upValue(item.characteristic_id, item.type, $event)"
			/>
			<div
				v-if="item.help"
				class="form-text"
			>
				{{ item.help }}
			</div>
		</div>
	</div>
</template>
<script>
import Wysiwyg from './Characteristics/Wysiwyg.vue';

export default {
	components: {Wysiwyg},
	props: ['group', 'value', 'groupId', 'productId'],

	data() {
		return {
			children: null
		};
	},

	beforeMount() {
		this.children = this.group.children;
	},

	methods: {
		getInputAttrs(item) {
			let out = {
				name: `characteristic[${item.characteristic_id}]`
			};

			if (['text', 'select', 'textarea'].indexOf(item.type) != -1)
				out.class = 'form-control';

			if (item.type == 'checkbox')
				out.name += '[]';

			return out;
		},

		upValue(characteristicId, type, e) {
			let value = this.$clear(this.value),
				inputVal
			;

			if (['text', 'textarea'].indexOf(type) != -1) {
				inputVal = String(e.target.value);
			} else if (type === 'wysiwyg') {
				inputVal = e;
			} else {
				inputVal = Number(e.target.value);
			}

			let index;

			switch (type) {
			case 'checkbox':
				if (!Array.isArray(value[characteristicId]))
					value[characteristicId] = [];

				index = value[characteristicId].findIndex((caseId) => {
					if (caseId == inputVal)
						return true;

					return false;
				});

				if (index === -1) {
					value[characteristicId].push(inputVal);
				} else {
					value[characteristicId].splice(index, 1);
				}
				break;

			default:
				value[characteristicId] = inputVal;
				break;
			}

			this.$emit('input', value);
		},

		isChecked(value, inputValue) {
			if (!Array.isArray(value))
				return false;

			return value.indexOf(inputValue) != -1;
		}
	}
};
</script>