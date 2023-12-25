import {TQueueEventType} from '../../../../../@types/rabbitMq';
import Form from '../../../../../modules/form/index';
import * as productEvents from '../../../components/productEventNotification';

export default class CategoryForm extends Form {
	getRules() {
		return [
			['category,action', 'required'],
			['category', 'cleanUpCategory'],
			['action', 'inOptions', {options: 'action'}]
		];
	}

	async save() {
		let attrs = this.getSafeAttrs();

		if (!Array.isArray(this.pk)) {
			this.addError('category', 'noArr', 'pk is not an array');
			return Promise.reject();
		}

		switch (attrs.action) {
			case 'moveTo':
				await this.moveToCategories();
				break;
			case 'addTo':
				await this.addToCategories();
				break;
			case 'del':
				await this.rmFromCategories();
				break;
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.pk
		);
	}

	async rmFromCategories() {
		const category = this.getSafeAttr('category');

		//@ts-ignore
		for (const productId of this.pk) {
			for (const categoryId of category) {
				//@ts-ignore
				await this.getModel('productCategoryRel').rmProductFromCategory(productId, categoryId);
			}
		}
	}

	async addToCategories() {
		const category = this.getSafeAttr('category');

		for (const productId of this.pk) {
			for (const categoryId of category) {
				//@ts-ignore
				await this.getModel('productCategoryRel').addProductToCategory(productId, categoryId);
			}
		}
	}

	async moveToCategories() {
		const category = this.getSafeAttr('category');

		for (const productId of this.pk) {
			//@ts-ignore
			await this.getModel('productCategoryRel').setProductCategories(productId, category);
		}
	}

	cleanUpCategory(value) {
		if (!Array.isArray(value)) {
			this.addError('category', 'noArr', 'Category is not an array');
			return;
		}

		const out = [];
		value.forEach((categoryId) => {
			if (/^\d+$/.test(categoryId))
				out.push(parseInt(categoryId));
		});

		if (!out.length) {
			this.addError('category', 'required', 'Please select categories');
			return;
		}

		if (out.length > 10) {
			this.addError('category', 'max', 'Maximum amount of categories for the operation is 10');
			return;
		}

		this.attributes.category = out;

	}

	rawOptions() {
		return {
			action: [['moveTo'], ['addTo'], ['del']]
		};
	}
}