import GridResource from '../../../../modules/controller/resources/grid';

export default class CollectionController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'catalog.collectionGrid.@c',
			provider: '@p-catalog/dataProvider/admin/collection',
			model: 'collection',
			form: '@p-catalog/forms/collection'
		});
	}

	actionIndex() {
		this.setPage({
			title: this.__('Collections')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const group = this.createFormsGroup({
			collection: {
				form: '@p-catalog/forms/collection'
			}
		}, {
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();
			//@ts-ignore
			const title = data.forms.collection?.scenario == 'update'
			//@ts-ignore
				? this.__('Update collection "%s"', [data.forms.collection?.attrs?.title])
				: this.__('Create collection')
			;
			this.modal('form', data, title, null, {
				setSize: 'large'
			});
		}
	}

	async actionChooseCollection() {
		const products = [].concat(this.getParam('products'));

		const formKit = this.createFormKit('@p-catalog/forms/collection/collectionProductForm', {products});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			return this.modal('collectionProductForm', data, this.__('With selected products (%s)', [String(products.length)]));
		}
	}
/*
	async actionBulkRm() {
		const model = this.getModel(this.grid.model);

		const options = {
			where: {
				// alias: null
			}
		};

		//@ts-ignore
		options.where[model.primaryKeyAttribute] = this.getParam('id');

		//@ts-ignore
		await model.safeDelete(options);
		this.alertSuccess(this.__('Selected items were successfully archived.'));
		return this.json({});
	}*/

	async actionSaveProductSort() {
		//@ts-ignore
		await this.getModel('collectionProductRel').saveSort(this.getParam('id'), this.getParam('sort'));
		//			@alertSuccess @__('Sort was successfully saved')
		this.json({});
	}
}
