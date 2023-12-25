import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class MenuItem extends ExtendedModel {
		static findParentOptions(blockId, langId, out, maxLevel, treePrefix) {
			if (out == null) {out = [];}
			if (maxLevel == null) {maxLevel = -1;}
			if (treePrefix == null) {treePrefix = '&nbsp;&nbsp;&nbsp;';}
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
item_id, \
title, \
level \
from \
vw_menu_item_tree \
where \
block_id = :block \
and lang_id = :lang \
and type = :type \
order by \
tree_sort\
', {
				block: blockId,
				lang: langId,
				type: 'folder'
			})
				.then(function (rows) {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						const {level, title, item_id} = row;
						if ((maxLevel !== -1) && (level > maxLevel)) {
							continue;
						}

						let name = title;
						for (let lvl = 0, end = level, asc = 0 <= end; asc ? lvl <= end : lvl >= end; asc ? lvl++ : lvl--) {
							if (lvl === 0) {
								continue;
							}

							name = `${treePrefix}${name}`;
						}

						out.push([item_id, name]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}

		static updateSort(parent, sort) {
			const deferred = Q.defer();

			const funcs = [];
			for (let i = 0; i < sort.length; i++) {
				const id = sort[i];
				const f = ((id, i) => {
					return () => {
						let parentWhere;
						const deferredItem = Q.defer();

						const params = {
							id,
							sort: i * 10
						};

						if (parent) {
							params.parent = parent;
							parentWhere = '= :parent';
						} else {
							parentWhere = 'is null';
						}

						this.sequelize.sql(`\
update \
menu_item \
set \
sort = :sort \
where \
parent_id ${parentWhere} \
and item_id = :id\
`, params)
							.then(() => {
								return deferredItem.resolve();
							});

						return deferredItem.promise;
					};
				}
				)(id, i);

				funcs.push(f);
			}

			let result = Q();
			funcs.forEach(f => result = result.then(f));

			result
				.then(() => {
					return deferred.resolve();
				}).done();

			return deferred.promise;
		}

		static getCacheKey(blockKey) {
			return `menu${blockKey}`;
		}

		static async clearCacheByCategory(instanceRegistry, categoryId) {
			const rows = await this.sequelize.sql(`
				select
					distinct menu_block.key
				from
					category_menu_rel
					inner join menu_block using (block_id)
				where
					category_id = :category
				union
				select
					distinct menu_block.key
				from
					menu_item
					inner join menu_item_rel using (item_id)
					inner join menu_block using (block_id)
				where
					menu_item.type = 'category'
					and category_id = :category
				`, {
				category: categoryId
			});

			const cacheKeys = rows.map(val => {
				//@ts-ignore
				return this.getCacheKey(val.key);
			});

			if (cacheKeys.length > 0) {
				await instanceRegistry.getCache().remove(cacheKeys);
			}
		}

		static async clearCacheByProduct(instanceRegistry, productId) {
			const rows = await this.sequelize.sql(`
				select
					distinct menu_block.key
				from
					menu_item
					inner join menu_item_rel using (item_id)
					inner join menu_block using (block_id)
				where
					menu_item.type = 'product'
					and product_id = :product
			`, {
				product: productId
			});

			const cacheKeys = rows.map(val => {
				//@ts-ignore
				return this.getCacheKey(val.key);
			});

			if (cacheKeys.length > 0) {
				await instanceRegistry.getCache().remove(cacheKeys);
			}
		}

		static clearCacheByPage(instanceRegistry, pageId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
distinct menu_block.key \
from \
menu_item \
inner join menu_item_rel using (item_id) \
inner join menu_block using (block_id) \
where \
menu_item.type = \'page\' \
and menu_item_rel.page_id = :page\
', {
				page: pageId
			})
				.then(rows => {
					const cacheKeys = rows.map(val => {
						//@ts-ignore
						return this.getCacheKey(val.key);
					});

					if (cacheKeys.length > 0) {
						return instanceRegistry.getCache().remove(cacheKeys);
					}
				}).then(() => {
					return deferred.resolve();
				}).catch(e => {
					return deferred.reject(e);
				});

			return deferred.promise;
		}

		static clearAllMenuCaches(instanceRegistry) {
			return instanceRegistry.getCache().remove([
				this.getCacheKey('top'),
				this.getCacheKey('bottom'),
				this.getCacheKey('category'),
			]);
		}
	}

	MenuItem.init({
		item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		block_id: {
			type: DataTypes.INTEGER
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		parent_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		type: {
			type: DataTypes.ENUM('folder', 'page', 'category', 'product', 'url')
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		url: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		highlight: {
			type: DataTypes.BOOLEAN
		},

		css_class: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'menu_item',
		modelName: 'menuItem',
		sequelize
	});

	return MenuItem;
}