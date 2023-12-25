<template>
	<form
		class="custom-attrs-form"
		name="customAttrs"
		@submit.prevent="$emit('submit')"
	>
		<div class="form-group">
			<label
				class="form-label"
				for="attr_title"
			>{{ __("Title:") }}</label>
			<input
				id="attr_title"
				v-model="form.title"
				class="form-control"
				name="title"
			>
		</div>
		<div class="form-group">
			<label
				class="form-label"
				for="attr_json_key"
			>{{ __("JSON key:") }}</label>
			<input
				id="attr_json_key"
				v-model="form.key"
				class="form-control"
				name="key"
			>
		</div>
		<div class="form-group">
			<label class="form-label"> {{ __("Type:") }} </label>
			<div
				v-for="row in options.type"
				:key="row[0]"
				class="radio mt-0 form-check"
			>
				<label class="form-check-label">
					<input
						v-model="form.type"
						class="form-check-input"
						type="radio"
						name="type"
						:value="row[0]"
					>
					{{ row[1] }}
				</label>
			</div>
		</div>

		<div
			:class="
				form.type === 'checkbox' || form.type === 'dropdown'
					? 'form-group mb-3'
					: 'd-none'
			"
		>
			<label class="form-label"> {{ __("Options:") }} </label>
			<ul
				ref="list"
				class="list-unstyled clearfix mb-0"
			>
				<template v-if="form.type === 'checkbox' || form.type === 'dropdown'">
					<li
						v-for="(option, i) in form.options"
						:key="option.id"
						class="attrs-options-item mb-2"
						:data-id="option.id"
						:data-title="option.title"
					>
						<div class="drag-me">
							<i
								class="fa fa-arrows"
								aria-hidden="true"
							/>
						</div>
						<input
							v-model="option.id"
							type="hidden"
							name="options[ids]"
						>
						<input
							v-model="option.title"
							class="form-control mr-3 option-title-input"
							name="options[titles]"
							@keydown.13.prevent="enterClick"
						>
						<a
							href="#"
							@click.prevent="rmOption(i)"
						>
							<i
								class="fa fa-trash-o"
								aria-hidden="true"
							/>
						</a>
					</li>
				</template>
			</ul>
			<div>
				<a
					href="#"
					@click.prevent="addOption"
				>
					<i
						class="fa fa-plus"
						aria-hidden="true"
					/> {{ __("Add option") }}
				</a>
			</div>
		</div>

		<div class="form-group">
			<label
				class="form-label"
				for="attr_hint"
			> {{ __("Hint:") }} </label>
			<textarea
				id="attr_hint"
				v-model="form.hint"
				rows="2"
				type="text"
				name="hint"
				class="form-control"
			/>
		</div>
		<div
			v-if="pk"
			class="form-group"
		>
			<label
				class="form-label"
				for="attr_sort"
			> {{ __("Sort:") }} </label>
			<input
				id="attr_sort"
				v-model="form.sort"
				name="sort"
				class="form-control"
				type="number"
			>
		</div>
		<div v-if="pk">
			<a
				href="#"
				@click.prevent="$emit('rmAttr')"
			>
				<i
					class="fa fa-trash"
					aria-hidden="true"
				/>
				{{ __("Remove attribute with all values") }}
			</a>
		</div>
		<div class="text-center">
			<button
				type="submit"
				class="btn btn-primary"
			>
				<i
					class="fa fa-floppy-o"
					aria-hidden="true"
				/> {{ __("Save") }}
			</button>
		</div>
	</form>
</template>
<script>
import $ from 'jquery';

const getNewOption = (options) => {
	const newIndex = options && options.length
		? (Math.max(...(options.map(el => Number(el.id.replace('id_', '').replace('option', ''))))) || 0) + 1
		: 1;

	return {id: `id_${newIndex}`, title: ''};
};


export default {
	props: ['attrs', 'pk', 'options'],
	data() {
		return {
			form: {
				...(this.attrs || {}),
				options: this.attrs?.options || [getNewOption()]
			}
		};
	},
	mounted() {
		$(this.$refs.list).sortable({
			placeholder: 'sortable-placeholder',
			handle: '.drag-me',
			stop: () => {
				const newArr = [];
				$(this.$refs.list)
					.find('li')
					.each((e, el) => {
						const id = $(el).data('id');
						const title = $(el).data('title');
						newArr.push({id, title});
					});

				this.form.options = newArr;
			}
		});
	},
	beforeDestroy() {
		const $list = $(this.$refs.list);
		if ($list.sortable('instance')) {
			$list.sortable('destroy');
		}
	},
	methods: {
		enterClick(e) {
			const inputsList = $('.option-title-input');
			const index = Array.from(inputsList).indexOf(e.target);
			if (index === -1) return;

			if (index < inputsList.length - 1) {
				inputsList[index + 1].focus();
			} else {
				this.addOption();
				setTimeout(() => {
					const newList = $('.option-title-input');
					newList[newList.length - 1].focus();
				}, 100);
			}
		},
		rmOption(index) {
			this.form.options = this.form.options.filter((el, i) => i !== index);
		},
		addOption() {
			this.form.options.push(getNewOption(this.form.options));
		},
	}
};
</script>