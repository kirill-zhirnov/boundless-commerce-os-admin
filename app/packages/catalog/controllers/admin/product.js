import GridResource from '../../../../modules/controller/resources/grid';
import AdminProductToBasket from '../../../orders/actions/admin/toBasket';
import * as editingProductChooser from '../../../catalog/modules/editingProductChooser';
import CopyProduct from '../../../catalog/modules/copyProduct';
// import ProductIndexer from '../../../system/modules/sphinx/productIndexer';
import {Op} from 'sequelize';
import * as productEvents from '../../components/productEventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export default class ProductController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'catalog.productGrid.@c',
			provider: '@p-catalog/dataProvider/admin/product',
			model: 'product',
			//			export was moved to separate controller
			//			exporterWidget : '@p-catalog/widgets/export/productGrid'
			essence: 'product'
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Products')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const pk = this.getParam('pk');
		const grid = this.getParam('grid');

		if (!pk) {
			await this.createNewProduct();
		} else {
			const group = this.createFormsGroup({
				product: {
					form: '@p-catalog/forms/product/product',
					children: {
						characteristics: '@p-catalog/forms/product/groupAndCharacteristics',
						categories: '@p-catalog/forms/product/categories',
						stockAndPrice: '@p-catalog/forms/product/stockAndPrice/forProduct',
						tax: '@p-catalog/forms/product/productTax',
						size: '@p-catalog/forms/product/size',
						labels: '@p-catalog/forms/product/labels',
						collections: '@p-catalog/forms/product/collections',
						props: '@p-catalog/forms/product/props',
						// yml: '@p-catalog/forms/product/yml',
						seo: '@p-catalog/forms/product/seo'
					}
				}
			}, {
				// 'stockAndPrice' - was in skipSaveOnEmpty
				skipSaveOnEmpty: ['size', 'props'],
				skipSetupOnEmpty: ['characteristics', 'yml'],
				errorAlert: false,
				successMsg: false,
				beforeJson(result, closeModal, formGroup) {
					//@ts-ignore
					result.json.status = formGroup.formKits.product.form.record.status;
				}
			});

			this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/product/index'));

			if (this.isSubmitted()) {
				await group.process();
			} else {
				const data = await group.getWebForms();
				let title;
				//@ts-ignore
				if (data.forms.product.status === 'draft') {
					title = this.__('Create new product');
				} else {
					//@ts-ignore
					title = this.__('Edit product "%s"', [data.forms.product.attrs.title]);
				}

				//@ts-ignore
				data.grid = grid;

				this.setPage('title', title);
				this.setResponseType('layout');
				this.setLayout('admin/productForm');
				this.setLayoutData('productData', data);
			}
		}
	}

	async createNewProduct() {
		const canCreate = await this.canCreateNewProduct();

		if (canCreate) {
			const result = await editingProductChooser.get(this, this.getUser().getId());
			const params = {
				pk: result.id
			};

			const grid = this.getParam('grid');
			if (grid) {
				params.grid = grid;
			}

			this.redirect(['catalog/admin/product/form', params]);
		} else {
			this.redirect(['catalog/admin/product/index']);
		}
	}

	async canCreateNewProduct() {
		const tariff = this.getInstanceRegistry().getTariff();
		const productLimitRes = await tariff.checkProductLimit();
		if (!productLimitRes) {
			this.alertDanger(this.__('Tariff\'s product limit is reached.'));
			return false;
		}

		const storageLimit = await tariff.checkStorageLimit({fileSize: 200000});
		if (!storageLimit) {
			this.alertDanger(this.__('Tariff\'s storage limit is reached.'));
			return false;
		}

		return true;
	}

	async actionCopy() {
		// const instanceId = this.getInstanceRegistry().getInstanceInfo().instance_id;
		const id = parseInt(this.getParam('pk'));
		if (!id) {
			this.rejectHttpError(400, 'Bad request');
			return;
		}

		const canCreate = await this.canCreateNewProduct();
		if (!canCreate) {
			this.redirect(['catalog/admin/product/index']);
			return;
		}

		//validation was moved to canCreateNewProduct:
		// const storageAvailable = await this.getInstanceRegistry().getTariff().checkStorageLimit();
		// if (!storageAvailable) {
		// 	this.alertDanger(this.__('Tariff\'s storage limit is reached.'));
		// 	this.redirect(['catalog/admin/product/index']);
		// 	return;
		// }

		const env = await this.getEnv();
		const copyProduct = new CopyProduct(env, id);
		const newProduct = await copyProduct.copy();

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.created,
			newProduct.product_id
		);

		this.redirect(['catalog/admin/product/form', {pk: newProduct.product_id}]);
	}

	actionToBasket() {
		const toBasket = new AdminProductToBasket(this, this.getParam('product'), this.getParam('orderId'));
		return toBasket.makeProductResponse();
	}

	async actionToBasketVariants() {
		const orderId = this.getParam('orderId') || null;

		const formKit = await this.createFormKit('@p-catalog/forms/product/basket', {
			//@ts-ignore
			orderId
		}, {
			success: (safeAttrs, pk) => {
				let alert;
				if (orderId) {
					alert = this.__('Product was successfully added to order');
				} else {
					alert = this.__('Product was successfully added to basket');
				}

				this.alertSuccess(alert);
				return this.json({
					closeModal: true,
					pk
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			let buttonTitle, modalTitle;
			if (orderId) {
				buttonTitle = this.__('Add to order');
				//@ts-ignore
				modalTitle = this.__('Add to order "%s"', [data.record.product_title]);
			} else {
				buttonTitle = this.__('Add to Cart');
				//@ts-ignore
				modalTitle = this.__('Add to Cart "%s"', [data.record.product_title]);
			}

			//@ts-ignore
			data.buttons = {
				//@ts-ignore
				...(data.buttons || {}),
				predefinedButtons: {
					save: {
						title: buttonTitle
					}
				}
			};

			this.modal('toBasket', {data}, modalTitle);
		}
	}

	async postActionChangeGroup() {
		const formKit = await this.createFormKit('@p-catalog/forms/product/group');
		await formKit.process();
	}

	async actionBulkRestore() {
		const pk = this.getParam('id');

		//@ts-ignore
		const res = await this.getInstanceRegistry().getTariff().checkProductLimit({
			action: 'recover',
			pk
		});
		if (res) {
			await super.actionBulkRestore();
			await this.reIndexProductByIds(pk);

			await productEvents.notifyProductsEvent(
				this.getInstanceRegistry(),
				this.getUser().getId(),
				TQueueEventType.restored,
				pk
			);
		} else {
			this.alertDanger(this.__('Tariff\'s product limit is reached.'));
			this.json({});
		}
	}

	async actionBulkRm() {
		const pk = this.getParam('id');
		await super.actionBulkRm();
		await this.reIndexProductByIds(pk);

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.archived,
			pk
		);
	}

	async actionCreateUrl() {
		if (!this.getParam('title') || !this.getParam('pk')) {
			this.alertDanger('you need to provide title and pk');
			this.json({});
			return;
		}

		//@ts-ignore
		const urlKey = await this.getModel('product').createUrlKeyByTitle(this.getParam('title'), this.getLang().code, this.getParam('pk'));
		this.json({url: urlKey});
	}

	// async actionPricesAndQty() {
	// 	const group = this.createFormsGroup({
	// 		product: {
	// 			form: '@p-catalog/forms/product/product',
	// 			children: {
	// 				// FIXME
	// 				// prices: '@p-catalog/forms/product/prices',
	// 				// qty: '@p-catalog/forms/product/simple/qty'
	// 			}
	// 		}
	// 	}, {
	// 		skipSaveOnEmpty: ['qty']
	// 	});

	// 	const data = await group.getWebForms();

	// 	this.json(data);
	// }

	async postActionClearRm() {
		const ProductModel = this.getModel('product');
		const where = {
			deleted_at: {
				[Op.ne]: null
			}
		};

		const toDelete = await ProductModel.findAll({where});
		//@ts-ignore
		const deletedPks = toDelete.map(el => el.product_id);
		//@ts-ignore
		await this.getModel('productImage').removeProductImages(deletedPks, this.getInstanceRegistry());
		await ProductModel.destroy({where});

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.removed,
			deletedPks
		);

		this.triggerClient('refresh.grid');
		this.json(true);
	}

	async reIndexProductByIds(id) {
		if (!Array.isArray(id)) {
			id = [id];
		}

		await this.getEnv();
		// const readyEnv = await this.getEnv();

		// FIXME
		// const indexer = new ProductIndexer(readyEnv);
		// return indexer.reIndexAll({
		// 	where: {
		// 		product_id: id
		// 	}
		// });
	}
}