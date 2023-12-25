import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import Q from 'q';
import speakingUrl from 'speakingurl';
import {Op} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Category extends ExtendedModel {
		static findOptions(siteId, langId, i18n = null, treePrefix = null) {
			if (treePrefix == null)
				treePrefix = '&nbsp;&nbsp;&nbsp;';

			return this.sequelize.sql(`
				select
					distinct
					category_id,
					parent_id,
					title,
					level,
					tree_sort
				from
					vw_category_option
				where
					site_id = :site
					and lang_id = :lang
					and deleted_at is null
				order by tree_sort
			`, {
				site: siteId,
				lang: langId
			})
				.then(function (rows) {
					const out = [];
					const allCategories = [];

					for (let row of Array.from(rows)) {
						var name;
						//@ts-ignore
						if (row.parent_id && (allCategories.indexOf(row.parent_id) === -1)) {
							continue;
						}

						//@ts-ignore
						allCategories.push(row.category_id);

						//@ts-ignore
						if (row.title) {
							//@ts-ignore
							name = row.title;
						} else {
							name = i18n ? i18n.__('No name') : 'No name';
						}

						//@ts-ignore
						for (let level = 0, end = row.level, asc = 0 <= end; asc ? level <= end : level >= end; asc ? level++ : level--) {
							if (level === 0) {
								continue;
							}

							name = `${treePrefix}${name}`;
						}

						//@ts-ignore
						out.push([row.category_id, name]);
					}

					return out;
				});
		}

		static updateSort(parent, sort) {
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

							this.sequelize.sql(`
								update
									category
								set
									sort = :sort
								where
									parent_id ${parentWhere}
									and category_id = :id
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

			return result;
		}

		static async loadCategory(siteId, langId, id) {
			const urlKey = String(id);
			id = parseInt(id);
			id = isNaN(id) ? 0 : id;

			const [row] = await this.sequelize.sql(`
				select
					category.*,
					category_text.*,
					category_prop.*
				from
				category
					inner join category_text using(category_id)
					inner join category_prop using(category_id)
				where
					category.site_id = :site
					and category.status != 'draft'
					and category.deleted_at is null
					and category_text.lang_id = :lang
					and (
						category.category_id = :id
						or category_text.url_key = :urlKey
					)
			`, {
				site: siteId,
				lang: langId,
				id,
				urlKey
			});

			return row;
		}

		static loadChildren(categoryId) {
			return this.sequelize.sql(`
				select
					*
				from
					category_get_children(:category)
				where
					deleted_at is null
				order by tree_sort
			`, {
				category: categoryId
			});
		}

		static loadParents(categoryId, langId, router = null) {
			return this.sequelize.sql(`
				select
					*
				from
					category_get_parents(:category)
				where
					lang_id = :lang
					and status = 'published'
					and deleted_at is null
					order by tree_sort desc
			`, {
				category: categoryId,
				lang: langId
			})
				.then(rows => {
					if (router) {
						for (let i = 0; i < rows.length; i++) {
							const row = rows[i];
							//@ts-ignore
							row.url = router.url('@category', {
								//@ts-ignore
								id: row.url_key ? row.url_key : row.category_id
							});

							rows[i] = row;
						}
					}

					return rows;
				});
		}

		static async createByTitle(title, site_id, lang_id, parent_id = null) {
			const category = await Category.create({
				site_id,
				parent_id
			});
			await this.sequelize.model('categoryText').update({
				title
			}, {
				where: {
					//@ts-ignore
					category_id: category.category_id,
					lang_id
				}
			});

			return category;
		}

		static createUrlKeyByTitle(title, langAlias, pk = null) {
			const urlKey = speakingUrl(title, {
				lang: langAlias
			});

			return this.findUniqueUrl(urlKey, pk);
		}

		static findUniqueUrl(urlKey, pk = null, suffix = null) {
			let checkingUrl = urlKey;

			if (suffix) {
				checkingUrl += `-${suffix}`;
			} else {
				suffix = 0;
			}

			const where = {url_key: checkingUrl};

			if (pk) {
				where.category_id = {[Op.ne]: pk};
			}

			return this.sequelize.model('categoryText').findOne({
				where
			})
				.then(row => {
					if (row) {
						return this.findUniqueUrl(urlKey, pk, ++suffix);
					} else {
						return checkingUrl;
					}
				});
		}

		// eslint-disable-next-line
		static async sphinxReIndex(categoryId, reIndexProducts = true) {
			return;

			// const deferred = Q.defer();
			//
			// this.sequelize.sql('select sphinx_replace_category(:id, :reIndexProducts)', {
			// 	id: categoryId,
			// 	reIndexProducts
			// })
			// 	.then(() => {
			// 		return deferred.resolve();
			// 	}).catch(() => {
			// 	return deferred.resolve();
			// });
			//
			// return deferred.promise;
		}

//			categoryId might be an array
//			Find all children for supplied list of id.
//			In the end you will get a list of categories, that should be affected if
//			parent is affected.
		static getCategoryTreeIdToUpdate(categoryId) {
			const deferred = Q.defer();

			categoryId = _.isArray(categoryId) ? categoryId : [categoryId];

			const out = [];
			let f = Q();

			for (let id of Array.from(categoryId)) {
				(id => {
					out.push(id);

					return f = f.then(() => this.loadChildren(id)
							.then(rows => {
								for (let row of Array.from(rows)) {
									//@ts-ignore
									out.push(row.category_id);
								}
							}));
				})(id);
			}

			f.then(() => {
				_.uniq(out);
				return deferred.resolve(out);
			}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static sphinxReIndexAll(options = {}, reIndexProducts = true) {
			const deferred = Q.defer();

			Q(this.findAll(options))
				.then(rows => {
					let f = Q();

					for (let row of Array.from(rows)) {
						(row => {
							return f = f.then(() => {
								return this.sphinxReIndex(row.category_id, reIndexProducts);
							});
						})(row);
					}

					return f;
				}).then(() => {
				return deferred.resolve();
			}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static sphinxReIndexOnBulkUpdate(options) {
			const deferred = Q.defer();

			Q()
				.then(() => {
					if (options.where != null ? options.where.category_id : undefined) {
						return this.getCategoryTreeIdToUpdate(options.where.category_id);
					} else {
						return false;
					}
				}).then(result => {
				let reIndexOptions;
				if (result === false) {
					reIndexOptions = options;
				} else {
					reIndexOptions = {
						where: {
							category_id: result
						}
					};
				}

				return this.sphinxReIndexAll(reIndexOptions);
			}).then(() => {
				return deferred.resolve();
			}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static markCategoryDeleted(categoryId) {
			const deferred = Q.defer();

			Q(this.findOne({
				where: {
					category_id: categoryId
				}
			}))
				.then(row => {
					if (!row) {
						return Q.reject('notFound');
					}

					if (row.parent_id) {
						//@ts-ignore
						return this.sequelize.model('productCategoryRel').removeCategoryProductsFromParents(
							categoryId,
							row.parent_id
						);
					}
				}).then(() => {
				return this.safeDelete({
					where: {
						category_id: categoryId
					}
				});
			}).then(() => deferred.resolve()).catch(function (e) {
				if (e === 'notFound') {
					return deferred.resolve();
				} else {
					return deferred.reject(e);
				}
			}).done();

			return deferred.promise;
		}

		static markCategoryRestored(categoryId) {
			const deferred = Q.defer();

			Q(this.findOne({
				where: {
					category_id: categoryId
				}
			}))
				.then(row => {
					if (!row) {
						return Q.reject('notFound');
					}

					if (row.parent_id) {
						//@ts-ignore
						return this.sequelize.model('productCategoryRel').addCategoryProductsToParents(
							categoryId,
							row.parent_id
						);
					}
				}).then(() => {
				return this.recover({
					where: {
						category_id: categoryId
					}
				});
			}).then(() => deferred.resolve()).catch(function (e) {
				if (e === 'notFound') {
					return deferred.resolve();
				} else {
					return deferred.reject(e);
				}
			}).done();

			return deferred.promise;
		}

		static async safeDelete(options = {where: {}}) {
			const attrs = {
				// @ts-ignore
				[this.options.deletedAt]: this.sequelize.fn('NOW')
			};

			await this.update(attrs, options);
			await this.sphinxReIndexOnBulkUpdate(options);
		}

		static async recover(options = {where: {}}) {
			const attrs = {
				// @ts-ignore
				[this.options.deletedAt]: null
			};

			await this.update(attrs, options);
			await this.sphinxReIndexOnBulkUpdate(options);
		}

		static createUrl(controller, row) {
			if (row.custom_link) {
				return row.custom_link;
			}

			return controller.url('@category', {
				id: row.url_key || row.category_id
			});
		}

		// since product_category_rel contains also relations for parent categories,
		// we need to rm or add products from/to old and new parent categories.
		static changeParent(categoryId, newParentId) {
			return this.sequelize.sql(`
				select parent_id from category where category_id = :category\
			`, {
				category: categoryId
			})
				.then(rows => {
					//@ts-ignore
					const oldParentId = rows[0].parent_id;

					if (oldParentId) {
						//@ts-ignore
						return this.sequelize.model('productCategoryRel').removeCategoryProductsFromParents(
							categoryId,
							oldParentId
						);
					}
				}).then(() => {
//					reset sort - to add category in the end
					return this.update({
						parent_id: newParentId,
						sort: null
					}, {
						where: {
							category_id: categoryId
						}
					});
				}).then(() => {
					if (newParentId) {
						//@ts-ignore
						return this.sequelize.model('productCategoryRel').addCategoryProductsToParents(
							categoryId,
							newParentId
						);
					}
				});
		}

		static countProducts(categoryId) {
			return this.sequelize.sql(`
				select
					count(product_id) as total
				from
					product_category_rel
					inner join product using(product_id)
				where
					category_id = :id
					and product.deleted_at is null
					and product.status != 'draft'
			`, {
				id: categoryId
			})
				.then(rows => {
					//@ts-ignore
					return rows[0].total;
				});
		}

		static isInMenu(categoryId, menuBlockKey = 'category') {
			return this.sequelize.sqlOne(`
				select
					1 as res
				from
					category_menu_rel
					inner join menu_block using (block_id)
				where
					menu_block.key = :key
					and category_id = :pk
			`, {
				pk: categoryId,
				key: menuBlockKey
			})
				.then(res => {
					if (res) {
						return true;
					} else {
						return false;
					}
				});
		}
	}

	Category.init({
		category_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		parent_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},

		external_id: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER
		},

		created_by: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		},

		image_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'category',
		deletedAt: 'deleted_at',
		modelName: 'category',
		sequelize
	});

	return Category;
}