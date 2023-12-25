import BasicAdmin from '../../../../system/controllers/admin';
import utils from '../../../../../modules/utils/server';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

export default class VariantController extends BasicAdmin {
	async actionCreateMulti() {
		let formKit = this.createFormKit('@p-catalog/forms/product/variant/createMulti', {
			productId: parseInt(this.getParam('product')),
			groupId: parseInt(this.getParam('group'))
		}, {
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.modal(
				'createMulti',
				{data},
				this.__('Specify Attributes for Creating variants')
			);
		}
	}

	async actionList() {
		const productId = parseInt(this.getParam('product'));
		if (!productId) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		const trackInventory = await this.getSetting('inventory', 'trackInventory');
		//@ts-ignore
		const variants = await this.getModel('variant').loadVariantsForTpl(
			productId,
			this.getSite().point_id,
			this.getEditingLang().lang_id,
			trackInventory
		);

		this.json(variants);
	}

	async actionRm() {
		let idList = this.getParam('id', []),
			productId = parseInt(this.getParam('product'))
			;

		if (!Array.isArray(idList) || !productId) {
			this.rejectHttpError(400, 'Incorrect params');
			return;
		}

		//split id list with bunches by 20 items
		idList = utils.splitArr(idList, 20);

		for (const bunch of idList) {
			await this.getModel('variant').destroy({
				//@ts-ignore
				where: {
					product_id: productId,
					variant_id: bunch
				}
			});
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			productId
		);

		this.json(true);
	}

	async actionForm() {
		let group = this.createFormsGroup({
			variant: {
				form: '@p-catalog/forms/product/variant/form',
				children: {
					stockAndPrice: '@p-catalog/forms/product/stockAndPrice/forVariant',
					size: '@p-catalog/forms/product/variant/size'
				}
			}
		}, {
			successMsg: false
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			let data = await group.getWebForms();

			this.modal(
				'form',
				{data},
				//@ts-ignore
				this.__('Variant "%s"', [data.forms.variant.attrs.title]),
				null,
				{setSize: 'large'}
			);
		}
	}

	async postActionSetPrice() {
		let formKit = this.createFormKit('@p-catalog/forms/product/variant/inlinePrice', {}, {
			successMsg: false,
			beforeJson: (result) => {
				//@ts-ignore
				let {price, old} = formKit.form.attributes;

				//@ts-ignore
				result.json.prices = {
					price,
					price_old: old
				};
			}
		});

		await formKit.process();
	}

	async actionSetQty() {
		let formKit = this.createFormKit('@p-catalog/forms/product/stockAndPrice/inlineQty', {}, {
			successMsg: false,
			beforeJson: (result) => {
				//@ts-ignore
				result.json.stock = formKit.form.getStock();
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		let data = await formKit.getWebForm();
		this.json(data);
	}
}