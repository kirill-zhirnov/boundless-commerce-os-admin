<template>
	<form name="customAttrs">
		<div
			v-for="attribute in attributes"
			:key="attribute.attr_id"
		>
			<div class="form-group">
				<label
					class="form-label"
					:for="`attr-${attribute.attr_id}`"
				>
					{{ attribute.title }}
					<a
						v-if="!isLocked"
						:href="
							url(editUrl, { pk: attribute.attr_id })
						"
						data-modal=""
					>
						<i class="fa fa-pencil" />
					</a>
				</label>
				<TextInput
					v-if="attribute.type === 'text'"
					:values="form"
					:attribute="attribute"
					@input="form[attribute.key] = $event"
				/>
				<TextAreaInput
					v-if="attribute.type === 'text_area'"
					:values="form"
					:attribute="attribute"
					@input="form[attribute.key] = $event"
				/>
				<CheckBoxInput
					v-if="attribute.type === 'checkbox'"
					:attribute="attribute"
					:check.sync="form[attribute.key]"
				/>
				<SelectInput
					v-if="attribute.type === 'dropdown'"
					:attribute="attribute"
					:select.sync="form[attribute.key]"
				/>
				<span class="text-muted">{{ attribute.hint }}</span>
			</div>
		</div>
		<div
			v-for="key in noAttrs"
			:key="key"
		>
			<div class="unlisted-attr form-group">
				<label class="form-label">
					{{ key }}
				</label>
				<div class="unlisted-attr-value">
					<pre>{{ JSON.stringify(form[key], null, 2) }}</pre>
				</div>
			</div>
		</div>
		<div>
			<a
				v-if="!isLocked"
				:href="addUrl"
				data-modal=""
			>
				<i
					class="fa fa-plus"
					aria-hidden="true"
				/> {{ __("Add attribute") }}
			</a>
		</div>
	</form>
</template>

<script>
import CheckBoxInput from './AttributesList/CheckBoxInput.vue';
import SelectInput from './AttributesList/SelectInput.vue';
import TextAreaInput from './AttributesList/TextAreaInput.vue';
import TextInput from './AttributesList/TextInput.vue';

export default {
	components: {
		TextInput,
		TextAreaInput,
		CheckBoxInput,
		SelectInput
	},
	props: ['addUrl', 'editUrl', 'isLocked', 'values', 'attributes'],
	computed: {
		form() {
			return this.values || {};
		},
		noAttrs() {
			const attrKeys = this.attributes.map(attr => attr.key);
			return Object.keys(this.values).filter(key => !attrKeys.includes(key));
		}
	},
};
</script>