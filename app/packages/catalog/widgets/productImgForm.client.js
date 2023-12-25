import FormWidget from '../../../modules/widget/form.client';
import ajax from '../../../modules/ajax/kit.client';
import {convertResponse} from '../../system/modules/autocomplete.client';

export default class ProductImgFormClient extends FormWidget {
	attributes() {
		return {
			action: this.url('catalog/admin/product/image/form'),
			class: 'product-img-form'
		};
	}

	async run() {
		return this.render('productImgForm');
	}

	events() {
		return Object.assign(super.events(), {
			async 'click .tag-remove'(e) {
				const $el = this.$(e.currentTarget);

				const idToRemove = $el.data('id');
				if (!idToRemove) return;

				this.data.attrs.tags = this.data.attrs.tags.filter(el => el.image_tag_id !== idToRemove);
				await this.reRenderTags();
			},
			'keydown input[name="tag"]' (e) {
				if (e.keyCode === 13) {
					e.preventDefault();
				}
			},
		});
	}

	async runLazyInit() {
		await this.reRenderTags();
		this.$('input[name="tag"]').autocomplete({
			forceFixPosition: true,
			triggerSelectOnValidInput: false,
			appendTo: '.modal-body',
			onSelect: this.selectTag.bind(this),
			formatResult: (suggestion) => {
				if (suggestion.data.isNew) {
					const icon = '<i class="fa fa-plus"></i>';
					const text = this.__('Add tag "%s"', [suggestion.value]);
					return `${icon} ${text}`;
				}
				return suggestion.value;
			},
			lookup: (request, response) => {
				const params = {
					q: request
				};

				ajax.get(this.url('cms/admin/imageTag/autocomplete'), params)
					.then(data => {
						const result = (data || []).map(el => ({image_tag_id: el.image_tag_id, value: el.title}));
						const exists = result.some(el => el.value.toLowerCase() === request.toLowerCase());
						if (!exists) {
							result.push({
								image_tag_id: Math.random(),
								isNew: true,
								value: request
							});
						}
						response(convertResponse(request, result));
					});
			},
			minChars: 2
		});
	}

	async reRenderTags() {
		const res = await this.localRender('productImgForm/tags');
		this.$('.tags-block').html(res);
	}

	async selectTag(tag) {
		const tags = this.data.attrs.tags || [];
		if (tags.find(el => el.image_tag_id === tag.data.image_tag_id)) return;

		tags.push({
			title: tag.value,
			image_tag_id: tag.data.image_tag_id,
			isNew: !!tag.data.isNew
		});
		this.data.attrs.tags = tags;

		await this.reRenderTags();
		this.$('input[name="tag"]').val('');
	}

	getFileName() {
		return __filename;
	}
}