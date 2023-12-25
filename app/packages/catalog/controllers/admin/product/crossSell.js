import BasicAdmin from '../../../../system/controllers/admin';
import helpCatalog from '../../../../../modules/help';
import * as productEvents from '../../../components/productEventNotification';
import {TQueueEventType} from '../../../../../@types/rabbitMq';

export default class CrossSellController extends BasicAdmin {
	async actionCategories() {
		//@ts-ignore
		let categories = await this.getModel('crossSellCategory').findAll({
			order: [['category_id', 'asc']]
		});

		let help = helpCatalog.get('aboutCrossSell');

		this.json({
			categories,
			help
		});
	}

	async actionProducts() {
		let categoryId = parseInt(this.getParam('category', 0)),
			productId = parseInt(this.getParam('product', 0))
		;

		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/product/crossSell', {
			categoryId: categoryId,
			productId : productId
		});

		let data = await dataProvider.getData();
		this.json(data[1]);
	}

	async actionAdd() {
		let formKit = this.createFormKit('@p-catalog/forms/product/crossSell', {}, {
			successMsg: false,
			beforeJson: () => {
				this.triggerClient('upCrossSell', {
					//@ts-ignore
					category: formKit.form.category.category_id
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
			return;
		}

		let data = await formKit.getWebForm();
		//@ts-ignore
		data.help = helpCatalog.get('crossSellSetRelation');

		//@ts-ignore
		this.modal('add', {data}, data.category.title, null, {
			setSize: 'large'
		});
	}

	async postActionRm() {
		const productId = this.getParam('product', 0);

		await this.getModel('crossSell').destroy({
			//@ts-ignore
			where: {
				category_id: this.getParam('category', 0),
				product_id: productId,
				rel_product_id: this.getParam('rel', 0)
			}
		});

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			productId
		);

		this.json(true);
	}

	async postActionRmAll() {
		const productIds = this.getParam('product', 0);
		//@ts-ignore
		const category = await this.getModel('crossSellCategory').findException({
			where: {
				alias: this.getParam('category', 0)
			}
		});

		await this.getModel('crossSell').destroy({
			//@ts-ignore
			where: {
				//@ts-ignore
				category_id: category.category_id,
				product_id: productIds,
			}
		});

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			productIds
		);

		this.json(true);
	}

	async postActionSort() {
		const categoryId = this.getParam('category', 0);
		const productId = this.getParam('product', 0);

		let sort = this.getParam('sort', []);
		sort = Array.isArray(sort) ? sort : [];

		for (let i = 0; i < sort.length; i++) {
			await this.getModel('crossSell').update({
				sort: i * 10
			}, {
				where: {
					category_id: categoryId,
					product_id: productId,
					rel_product_id: sort[i]
				}
			});
		}

		this.json(true);
	}
}