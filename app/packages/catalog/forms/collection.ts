import BasicForm from '../../../modules/form/index';
import {ICollectionModel, ICollectionModelStatic} from '../models/collection';

interface IAttrs {
	title: string;
	alias: string | null;
}

export default class Collection extends BasicForm<IAttrs, ICollectionModel> {
	getRules() {
		return [
			['title', 'required'],
			[
				'alias',
				'isUnique',
				{
					model: this.getModel('collection'),
					row: this.record ? this.record : null,
					criteria: {
						where: {
							site_id: this.getEditingSite().site_id,
							lang_id: this.getEditingLang().lang_id
						}
					}
				}
			]
		];
	}

	async loadRecord() {
		const row = await (this.getModel('collection') as ICollectionModelStatic).findException({
			where: {
				collection_id: this.pk
			}
		}) as ICollectionModel;

		return row;
	}

	setupAttrsByRecord() {
		this.setAttributes(this.record.toJSON());
	}

	async save() {
		if (!this.record) {
			this.record = (this.getModel('collection') as ICollectionModelStatic).build().set({
				site_id: this.getEditingSite().site_id,
				lang_id: this.getEditingLang().lang_id
			});
		}

		const {title, alias} = this.getSafeAttrs();

		this.record.set({
			title,
			alias
		});
		await this.record.save();
	}
}
