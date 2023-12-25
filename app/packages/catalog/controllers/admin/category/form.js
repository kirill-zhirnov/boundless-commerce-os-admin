import BasicAdmin from '../../../../system/controllers/admin';
import editingCategoryChooser from '../../../modules/editingCategoryChooser';

export default class CategoryFormController extends BasicAdmin {
	async actionEdit() {
		const pk = this.getParam('pk');

		if (!pk) {
			return this.createNewCategory();
		}

		const group = this.createFormsGroup({
			category: {
				form: '@p-catalog/forms/category/category',
				children: {
					parentCategory: '@p-catalog/forms/category/parent',
					description: '@p-catalog/forms/category/description',
					seo: '@p-catalog/forms/category/seo',
					props: '@p-catalog/forms/category/props'
				}
			}
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const webForms = await group.getWebForms();

			//@ts-ignore
			webForms.grid = this.getParam('grid');

			this.setPage(
				'title',
				//@ts-ignore
				(webForms.forms.category.status == 'draft') ? this.__('Create category') : this.__('Edit category')
			);
			this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/category/index'));

			this.widget('system.vueApp.@c', {
				data: {
					app: 'catalog/categoryForm',
					props: webForms
				}
			});
		}
	}

	async createNewCategory() {
		const result = await editingCategoryChooser.get(
			await this.createState(),
			this.getUser().getId()
		);

		const params = {
			pk: result.id
		};

		const grid = this.getParam('grid');
		if (grid)
			params.grid = grid;

		this.redirect(['catalog/admin/category/form/edit', params]);
	}
}