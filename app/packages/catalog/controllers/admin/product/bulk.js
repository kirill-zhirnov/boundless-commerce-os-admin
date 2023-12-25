import BasicAdmin from '../../../../system/controllers/admin';
import * as utils from '../../../../../modules/utils/server';
import CopyProduct from '../../../modules/copyProduct';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

export default class BulkController extends BasicAdmin {
	async postActionStatus() {
		let pk = this.getParam('pk');
		const status = this.getParam('publish') == '1' ? 'published' : 'hidden';

		if (!Array.isArray(pk))
			pk = [];

		for (const bunch of utils.splitArr(pk, 100)) {
			await this.getModel('product').update({
				status
			}, {
				where: {
					product_id: bunch
				}
			});
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			pk,
		);

		this.triggerClient('refresh.grid');
		this.json(true);
	}

	async actionCategory() {
		const formKit = this.createFormKit('@p-catalog/forms/product/bulk/category', {}, {
			success: () => {
				this.triggerClient('refresh.grid');
				this.json({
					result: true,
					closeModal: true
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			this.modal('category', {data}, this.__('With selected products (%s)', [data.pk.length]));
		}
	}

	async actionCopy() {
		let pk = this.getParam('pk');

		if (!Array.isArray(pk))
			pk = [];

		const copyLimit = 5;
		if (pk.length > copyLimit) {
			this.alertDanger(this.__('You can copy max %s products at once.', [String(copyLimit)]));
			this.json({});
			return;
		}

		const tariff = this.getInstanceRegistry().getTariff();
		const isAllowToCreate = await tariff.checkProductLimit({
			qty: pk.length
		});

		if (!isAllowToCreate) {
			this.alertDanger(this.__('Tariff\'s product limit is reached.'));
			this.json({});
			return;
		}

		const storageAvailable = await tariff.checkStorageLimit({fileSize: 200000});
		if (!storageAvailable) {
			this.alertDanger(this.__('Tariff\'s storage limit is reached.'));
			this.json({});
			return;
		}

		const env = await this.getEnv();
		const newPks = [];
		for (const productId of pk) {
			const copyProduct = new CopyProduct(env, productId);
			const {product_id} = await copyProduct.copy();

			if (product_id) {
				newPks.push(product_id);
			}
		}

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.created,
			newPks
		);

		this.triggerClient('refresh.grid');
		this.json(true);
	}

	async actionSetPrices() {
		const formKit = this.createFormKit('@p-catalog/forms/product/stockAndPrice/bulkPrices', {}, {
			success: () => {
				this.triggerClient('refresh.grid');
				this.json({
					result: true,
					closeModal: true
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			this.modal('setPrices', {data}, this.__('With selected products (%s)', [data.pk.length]), null, {
				setSize: 'small'
			});
		}
	}

	async actionSetStock() {
		const formKit = this.createFormKit('@p-catalog/forms/product/stockAndPrice/bulkStock', {}, {
			success: () => {
				this.triggerClient('refresh.grid');
				this.json({
					result: true,
					closeModal: true
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			this.modal('setStock', {data}, this.__('With selected products (%s)', [data.pk.length]), null, {
				setSize: 'small'
			});
		}
	}
}