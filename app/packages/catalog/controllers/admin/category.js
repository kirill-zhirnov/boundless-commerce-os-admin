import BasicAdmin from '../../../system/controllers/admin';
import {Op} from 'sequelize';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export default class CategoryController extends BasicAdmin {
	async actionIndex() {
		this.setPage({
			title: this.__('Categories')
		});

		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/category');
		const data = await dataProvider.getTplData();

		const totalCategories = await this.getModel('category').count();

		this.render('index', {
			widgetData: {
				filter: data,
				isEmptyCategories: totalCategories === 0
			}
		});
	}

	async actionCreateUrl() {
		//@ts-ignore
		const urlKey = await this.getModel('category').createUrlKeyByTitle(this.getParam('title'), this.getLang().code, this.getParam('pk'));

		return this.json({url: urlKey});
	}

	async actionTreeCollection() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/category');
		//@ts-ignore
		const collection = await dataProvider.getTreeCollection();
		return this.json(collection.toJSON());
	}

	async actionRm() {
		let idList = this.getParam('id');
		if (!Array.isArray(idList)) {
			idList = [];
		}

		for (const categoryId of idList) {
			const id = parseInt(categoryId);
			if (!isNaN(categoryId)) {
				//@ts-ignore
				await this.getModel('category').markCategoryDeleted(id);
			}
		}

		await this.essenceChanged('category', [], 'bulkRm');

		await this.getInstanceRegistry().getEventPublisher().publish(TQueueEventType.archived, {
			model: 'category',
			pkList: idList
		});

		return this.json({});
	}

	async actionRestore() {
		let idList = this.getParam('id');
		if (!Array.isArray(idList)) {
			idList = [];
		}

		for (const categoryId of idList) {
			const id = parseInt(categoryId);
			if (!isNaN(categoryId)) {
				//@ts-ignore
				await this.getModel('category').markCategoryRestored(id);
			}
		}

		await this.essenceChanged('category', [], 'bulkRestore');

		await this.getInstanceRegistry().getEventPublisher().publish(TQueueEventType.restored, {
			model: 'category',
			pkList: idList
		});

		return this.json({});
	}

	async actionSaveSort() {
		//@ts-ignore
		await this.getModel('category').updateSort(this.getParam('parent'), this.getParam('sort'));
		await this.essenceChanged('category', [], 'sorted');

		await this.getInstanceRegistry().getEventPublisher().publish(TQueueEventType.sorted, {
			model: 'category',
		});

		return this.json({});
	}

	async actionInlineForm() {
		const formKit = this.createFormKit('@p-catalog/forms/category/inline', {}, {
			successMsg: false,
			beforeJson(result) {
				result.json.closeModal = false;
			}
		});

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			return this.json(data);
		}
	}

	actionInlineFormModal() {
		return this.modal('inlineCategoryForm', {data: {isDetached: true}}, this.__('Create category'), null, {
			appendDialogClass: ['admin-modal']
		});
	}

	async actionMenuShow() {
		const pk = this.getParam('id');

		//@ts-ignore
		await this.getModel('categoryMenuRel').showInCategoryMenu(pk, this.getEditingSite().site_id);
		await this.essenceChanged('category', [], 'changeMenuVisibility');

		await this.getInstanceRegistry().getEventPublisher().modelChanged({
			model: 'category',
			pkList: pk
		});

		return this.json(true);
	}

	async actionMenuHide() {
		const pk = this.getParam('id');

		//@ts-ignore
		await this.getModel('categoryMenuRel').hideFromCategoryMenu(pk, this.getEditingSite().site_id);
		await this.essenceChanged('category', [], 'changeMenuVisibility');

		await this.getInstanceRegistry().getEventPublisher().modelChanged({
			model: 'category',
			pkList: pk
		});

		return this.json(true);
	}

	postActionQuickEdit() {
		const formKit = this.createFormKit('@p-catalog/forms/category/quickEdit', {}, {
			successMsg: false,
			success: (safeAttrs, pk) => {
				return this.json({pk});
			}
		});
		return formKit.process();
	}

	postActionMove() {
		const formKit = this.createFormKit('@p-catalog/forms/category/move', {}, {
			successMsg: false
		});
		return formKit.process();
	}

	async postActionPublishStatus() {
		let pk = this.getParam('pk');
		const isPublished = this.getParam('publish');

		if (!Array.isArray(pk)) {
			pk = [];
		}

		await this.getModel('category').update({
			status: isPublished === '1' ? 'published' : 'hidden'
		}, {
			where: {
				category_id: pk
			}
		});

		await this.getInstanceRegistry().getEventPublisher().modelChanged({
			model: 'category',
			pkList: pk
		});

		return this.json(true);
	}

	async postActionClearRm() {
		await this.getModel('category').destroy({
			//@ts-ignore
			where: {
				deleted_at: {
					[Op.ne]: null
				}
			}
		});

		return this.json(true);
	}
}