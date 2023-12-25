import Form from '../../../../modules/form/index';
import ExtendedModel from '../../../../modules/db/model';
import {diff} from 'deep-object-diff';
import {TPublishingStatus} from '../../../../@types/db';

export default class BasicCategory extends Form {
	async loadRecord() {
		//@ts-ignore
		const out: ExtendedModel & {status: TPublishingStatus} = await this.getModel('category').findException({
			include: [
				{
					model: this.getModel('categoryText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				},
				{
					model: this.getModel('categoryProp'),
				},
			],
			where: {
				category_id: this.pk
			}
		});

		return out;
	}

	isParentChanged(newParent, prevParent) {
		newParent = newParent ? parseInt(newParent) : 0;
		prevParent = prevParent ? parseInt(prevParent) : 0;

		return newParent !== prevParent;
	}

	async getParentOptions(addEmptyOption) {
		if (addEmptyOption == null) {addEmptyOption = true;}
		//@ts-ignore
		const out = await this.getModel('category').findOptions(this.getEditingSite().site_id, this.getEditingLang().lang_id, this.getI18n());

		if (addEmptyOption) {
			out.unshift(['0', '']);
		}

		return out;
	}

	async saveCategoryAttrs(record, attrs) {
		const row = record ? record : this.getModel('category').build();
		const parentChanged = this.isParentChanged(attrs.parent_id, row.parent_id);

		row.site_id = this.getEditingSite().site_id;

		await row.save();
		if (parentChanged) {
			//@ts-ignore
			await this.getModel('category').changeParent(row.category_id, attrs.parent_id);
		}

		return row;
	}

	async triggerCategoryChanged() {
		const categoryAfterSave = await this.loadRecord();
		if (categoryAfterSave.status !== TPublishingStatus.draft) {
			const eventPublisher = this.getInstanceRegistry().getEventPublisher();
			await eventPublisher.modelChanged({
				model: 'category',
				pkList: [this.pk as number],
				diff: diff(this.record.toJSON(), categoryAfterSave.toJSON()),
				userId: this.getUser().getId()
			});
		}
		//@ts-ignore
		await this.essenceChanged('category', this.pk, 'change');
	}

	async countProducts() {
		if (!this.record) {
			return 0;
		}

		//@ts-ignore
		return this.getModel('category').countProducts(this.record.category_id);
	}
}