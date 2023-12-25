import Modal from '../../../modules/modal/modal.client';

export default class ChooseVariant extends Modal {
	attributes() {
		return Object.assign({}, super.attributes(), {
			'class': 'modal choose-variant'
		});
	}

	events() {
		return Object.assign({}, super.events(), {
			'change input[name=\'variant\']': 'onVariantSelect'
		});
	}

	onVariantSelect(e) {
		const $el = this.$('input[name=\'variant\']:checked');

		if ($el.length === 0) {
			return;
		}

		const data = {
			item_id: $el.val(),
			title: $el.parent().find('span.title').text(),
			sku: $el.parents('.list-group-item').find('span.sku').text(),
			available_qty: $el.parents('.list-group-item').find('span.available').text(),
			reserved_qty: $el.parents('.list-group-item').find('span.reserved').text(),
			price: $el.parents('.list-group-item').find('span.price').data('price') || 0
		};


		this.$('.choose-variant-form').trigger('variantSelected.form', [data]);

		return this.close();
	}
}
