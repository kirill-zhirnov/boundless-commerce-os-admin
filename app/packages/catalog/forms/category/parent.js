import CategoryBasicForm from './basic';

export default class ParentCategoryForm extends CategoryBasicForm {
	getRules() {
		return [
			['parent_id', 'inOptions', {options: 'parent'}],
			[
				'parent_id',
				'tree',
				{
					pk: 'category_id',
					row: this.record
				}
			],
			['parent_id', 'validateParent'],
			['is_published', 'safe'],
			['image_id', 'safe']
		];
	}

	async setupAttrsByRecord() {
		//@ts-ignore
		const {status, parent_id, image_id} = this.record;

		const image = image_id
			//@ts-ignore
			? await this.getModel('image').findException({
				where: {
					image_id
				}
			})
			: null;

		const attrs = {
			is_published: (['published', 'draft'].indexOf(status) != -1) ? '1' : '',
			parent_id: parent_id || 0,
			image: image ? image.path : null,
			image_id: image ? image.image_id : null,
		};

		this.setAttributes(attrs);
	}

	async save() {
		//@ts-ignore
		const {is_published, image_id, parent_id} = this.getSafeAttrs();
		const record = await this.getRecord();
		const parentId = parseInt(parent_id) || '';

		//@ts-ignore
		const parentChanged = this.isParentChanged(parentId, record.parent_id);
		const saveAttrs = {
			//@ts-ignore
			status: (is_published == '1') ? 'published' : 'hidden',
			image_id: image_id || null
		};

		await record
			//@ts-ignore
			.set(saveAttrs)
			.save();

		if (parentChanged) {
			//@ts-ignore
			await this.getModel('category').changeParent(record.category_id, parentId);
		}
	}

	rawOptions() {
		return {
			parent: this.getParentOptions()
		};
	}

	async validateParent(parentId) {
		parentId = parseInt(parentId);

		if (!parentId)
			return;

		let rows = await this.getDb().sql(`
			select
				category_id
			from
				category_get_children(:categoryId)
			where
				category_id = :parentId
			order by
				tree_sort asc
		`, {
			//@ts-ignore
			categoryId: this.record.category_id,
			parentId: parentId
		});

		if (rows.length) {
			this.addError('parent_id', 'parentNotValid', this.__('Parent category can\'t be a child.'));
			return;
		}
	}
}