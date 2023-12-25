import BasicSeoTpls from './basic';
import errors from '../../../../modules/errors/errors';

export default class CategorySeoTemplates extends BasicSeoTpls {
	async getTemplates() {
		if (!this.templates) {
			const seoTpls = await this.getSetting('system', 'seoTemplates');
			this.templates = seoTpls.category;
		}

		return this.templates;
	}

	async compileByCategoryId(id) {
		let categoryInfo = await this.getModel('category').loadCategory(
			this.getSite().site_id,
			this.getLang().lang_id,
			id,
		);

		if (!categoryInfo)
			throw new errors.HttpError(404, 'Category not found');

		return await this.compileByCategoryRow(categoryInfo);
	}

	async compileByCategoryRow(categoryInfo) {
		return {
			title: await this.compileTitle(categoryInfo),
			metaDesc: await this.compileMetaDesc(categoryInfo)
		};
	}

	async compileTitle(categoryInfo, runInVm = false) {
		const templates = await this.getTemplates();

		return this.compile(
			templates.title,
			this.prepareData(categoryInfo),
			runInVm
		);
	}

	async compileMetaDesc(categoryInfo, runInVm = false) {
		const templates = await this.getTemplates();

		return this.compile(
			templates.metaDescription,
			this.prepareData(categoryInfo),
			runInVm
		);
	}

	fakeData() {
		return {
			category_id: 112,
			parent_id: 99,
			title: 'iPad mini',
			url_key: 'ipad-mini',
			description_top: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
			description_bottom: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
		};
	}

	prepareData(categoryInfo) {
		let out = {
			id: categoryInfo.category_id,
			parentId: categoryInfo.parent_id,
			title: categoryInfo.title || '',
			topDescription: this.prepareHtmlText(categoryInfo.description_top),
			bottomDescription: this.prepareHtmlText(categoryInfo.description_bottom),
			shortTopDescription: '',
			shortBottomDescription: '',
		};

		if (out.topDescription) {
			out.shortTopDescription = this.cutShortHtmlText(out.topDescription);
		}

		if (out.bottomDescription) {
			out.shortBottomDescription = this.cutShortHtmlText(out.bottomDescription);
		}

		return Object.assign(out, this.getTplFunctions());
	}
}