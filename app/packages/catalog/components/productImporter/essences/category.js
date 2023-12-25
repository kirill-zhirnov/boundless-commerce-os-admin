import errorLogger from '../../../../../modules/logger/error';
import onEssenceChanged from '../../../../system/modules/onEssenceChanged';
import validator from 'validator';

export default class ImportCategoryEssence {
	constructor(instanceRegistry, importRow, importLogger) {
		this.instanceRegistry = instanceRegistry;
		this.importRow = importRow;
		this.importLogger = importLogger;
		this.db = this.instanceRegistry.getDb();
	}

	async process(data) {
		let category = null;

		try {
			const row = await this.findOrCreate(data['category'], data['external_category_id']);
			category = row;

			const [_row, created] = await this.db.model('productImportRel').findOrCreate({
				where: {
					log_id: this.importLogger.getLogId(),
					category_id: category.category_id
				},
				defaults: {
					status: 'updated'
				}
			});
			if (created) {
				this.importLogger.addCategoryUpdated();
			}

			await this.update(category, data);
			await onEssenceChanged.trigger(this.instanceRegistry, 'category', [category.category_id], 'change');

			return category;
		} catch (e) {
			if (category) {
				try {
					await this.db.model('productImportRel').update({
						status: 'error',
						message: e
					}, {
						where: {
							log_id: this.importLogger.getLogId(),
							category_id: category.category_id
						}
					});
				} catch (err) {
					errorLogger.error(err);
				}
			} else {
				errorLogger.error(e);
			}
		}
	}

	async find(title, externalId) {
		const categoryWhere = {
			site_id: this.importRow.site_id
		};

		const textWhere = {
			lang_id: this.importRow.lang_id
		};

		if (externalId) {
			categoryWhere['external_id'] = String(externalId);
		} else {
			textWhere['title'] = title;
		}

		const row = await this.db.model('categoryText').findOne({
			include: [
				{
					model: this.db.model('category'),
					where: categoryWhere
				}
			],
			where: textWhere
		});

		return row;
	}

	async create(title, externalId, parentId = null) {
		let category = null;

		const row = await this.db.model('category').createByTitle(title, this.importRow.site_id, this.importRow.lang_id, parentId);
		category = row;

		if (externalId) {
			await category.update({
				external_id: externalId
			});
		}

		await this.db.model('categoryMenuRel').showInCategoryMenu(category.category_id, this.importRow.site_id);
		await this.db.model('productImportRel').create({
			log_id: this.importLogger.getLogId(),
			category_id: category.category_id,
			status: 'created'
		});

		this.importLogger.addCategoryInserted();
		return category;
	}

	async update(category, data) {
		if (data['external_parent_id']) {
			const row = await this.db.model('category').findOne({
				where: {
					external_id: data['external_parent_id']
				}
			});

			if (row) {
				category.parent_id = row.category_id;
				await category.save();
			}
		}

		if (data['category']) {
			let title = String(data['category']);
			if (/>/.test(title)) {
				const tree = title.split('>').map(title => validator.trim(title)).filter(val => val != '');
				if (tree.length > 0) {
					title = tree[(tree.length - 1)];
				}
			}

			await this.db.model('categoryText').update({title}, {
				where: {
					category_id: category.category_id,
					lang_id: this.importRow.lang_id
				}
			});
		}
	}

	async findOrCreate(title, externalId) {
		const row = await this.find(title, externalId);

		if (row) {
			return row.category;
		}

		const categoryByTree = await this.tryToFindOrCreateByTree(title, externalId);
		if (categoryByTree) {
			return categoryByTree;
		}

		return await this.create(title, externalId);
	}

	/**
	 * Method is for titles: "Category > Subcategory > SubSub Category".
	 */
	async tryToFindOrCreateByTree(title, externalId) {
		if (!/>/.test(String(title))) {
			return;
		}

		const tree = title.split('>').map(title => validator.trim(title)).filter(val => val != '');
		if (!tree.length) {
			return;
		}

		let parentId = null;
		const lastIndex = tree.length - 1;
		for (const [i, itemTitle] of tree.entries()) {
			let categoryItem = await this.findByTitleAndParent(itemTitle, parentId);

			if (categoryItem) {
				parentId = categoryItem.category_id;
			} else {
				categoryItem = await this.create(
					itemTitle,
					i === lastIndex ? externalId : null,
					parentId
				);

				parentId = categoryItem.category_id;
			}

			if (i === lastIndex && categoryItem) {
				return categoryItem;
			}
		}
	}

	async findByTitleAndParent(title, parentId) {
		const params = {title, site: this.importRow.site_id, lang: this.importRow.lang_id};
		let where = '';
		if (parentId) {
			where += ' and parent_id = :parent';
			params.parent = parentId;
		} else {
			where += ' and parent_id is null';
		}

		const [row] = await this.db.sql(`
			select
				*
			from vw_category_option
			where
				title = :title
				and site_id = :site
				and lang_id = :lang
				${where}
		`, params);

		return row;
	}
}