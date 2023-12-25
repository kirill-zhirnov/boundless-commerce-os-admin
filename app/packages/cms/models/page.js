import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
import _ from 'underscore';
import speakingUrl from 'speakingurl';
import validator from '../../../modules/validator/validator';
import {Op} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Page extends ExtendedModel {
		getUrl() {
			//@ts-ignore
			return this.Model.getUrl(this);
		}

		static findOptions(siteId, langId, out, where, treePrefix) {
			if (out == null) {out = [];}
			if (where == null) {where = {};}
			if (treePrefix == null) {treePrefix = '&nbsp;&nbsp;&nbsp;';}
			const deferred = Q.defer();

			const params = {
				siteId,
				langId
			};

			let whereStr = '';
			if (where.type) {
				whereStr = 'and type = :type';
				params.type = where.type;
			}

			this.sequelize.sql(`\
select \
* \
from \
vw_page_option \
where \
site_id = :siteId \
and lang_id = :langId \
and deleted_at is null \
${whereStr}\
`, params)
				.then(rows => {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						const {title, level, page_id} = row;
						let name = title;

						for (let lvl = 0, end = level, asc = 0 <= end; asc ? lvl <= end : lvl >= end; asc ? lvl++ : lvl--) {
							if (lvl === 0) {
								continue;
							}

							name = `${treePrefix}${name}`;
						}

						out.push([page_id, name]);
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
page \
set \
sort = :sort \
where \
parent_id ${parentWhere} \
and page_id = :id\
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

		static loadPage(siteId, langId, pageId, onlyActive) {
			if (onlyActive == null) {onlyActive = true;}
			const deferred = Q.defer();

			const commonWhere = {
				site_id: siteId,
				lang_id: langId
			};

			if (onlyActive) {
				commonWhere.deleted_at = null;
			}

			//				commonWhere.type = type

			const loadById = pageId => {
				return Q(this.findOne({
					include: [
						{
							model: this.sequelize.model('pageProps')
						}
					],
					where: _.extend({}, commonWhere, {
						page_id: pageId
					})
				})
				);
			};

			const loadByUrlKey = urlKey => {
				return Q(this.findOne({
					include: [
						{
							model: this.sequelize.model('pageProps')
						}
					],
					where: _.extend({}, commonWhere, {
						url_key: urlKey
					})
				})
				);
			};

			pageId = String(pageId);

			Q()
				.then(() => {
					if (validator.isNumeric(pageId)) {
						return loadById(pageId);
					} else {
						return loadByUrlKey(pageId);
					}
				}).then(page => {
					if (page) {
						page.urlArgs = this.getUrlArgs(page);
					}

					return deferred.resolve(page);
				}).done();

			return deferred.promise;
		}

		static getUrl(row, isAbsolute) {
			if (isAbsolute == null) {isAbsolute = false;}

			//FIXME Закомментировал return ниже из-за ошибок TS в registry, вставил пустой return
			return '';

			// return registry.getRouter().url('@page', {
			// 	id: row.url_key ? row.url_key : row.page_id
			// }, isAbsolute);
		}

		static getUrlArgs(row, isAbsolute) {
			if (isAbsolute == null) {isAbsolute = false;}
			return ['@page', {
				id: row.url_key ? row.url_key : row.page_id
			}, isAbsolute];
		}

		static getPageTreeIdToUpdate(pageId) {
			const deferred = Q.defer();

			pageId = _.isArray(pageId) ? pageId : [pageId];

			const out = [];
			let f = Q();

			for (let id of Array.from(pageId)) {
				(id => {
					out.push(id);

					return f = f.then(() => {
						const deferredItem = Q.defer();

						this.loadChildren(id)
							.then(rows => {
								for (let row of Array.from(rows)) {
									out.push(row.page_id);
								}

								return deferredItem.resolve();
							}).done();

						return deferredItem.promise;
					});
				})(id);
			}

			f.then(() => {
				_.uniq(out);
				return deferred.resolve(out);
			}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static sphinxReIndexAll(options) {
			if (options == null) {options = {};}
			const deferred = Q.defer();

			Q(this.findAll(options))
				.then(rows => {
					let f = Q();

					for (let row of Array.from(rows)) {
						(row => {
							return f = f.then(() => {
								return this.sphinxReIndex(row.page_id);
							});
						})(row);
					}

					return f;
				}).then(() => {
					return deferred.resolve();
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static sphinxReIndex(pageId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select sphinx_replace_page(:pageId)\
', {
				pageId
			})
				.then(() => deferred.resolve()).catch(() => //    e =>              console.error e
					deferred.resolve());

			return deferred.promise;
		}

		static loadChildren(pageId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
* \
from \
page_get_children(:page) \
where \
deleted_at is null\
', {
				page: pageId
			})
				.then(rows => {
					return deferred.resolve(rows);
				});

			return deferred.promise;
		}

		static sphinxReIndexOnBulkUpdate(options) {
			const deferred = Q.defer();

			Q()
				.then(() => {
					if (options.where != null ? options.where.page_id : undefined) {
						return this.getPageTreeIdToUpdate(options.where.page_id);
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
								page_id: result
							}
						};
					}

					return this.sphinxReIndexAll(reIndexOptions);
				}).then(() => {
					return deferred.resolve();
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static safeDelete(options) {
			if (options == null) {options = {};}
			const deferred = Q.defer();

			const attrs = {};
			attrs[this.options.deletedAt] = this.sequelize.fn('NOW');

			Q(this.update(attrs, options))
				.then(() => {
					return this.sphinxReIndexOnBulkUpdate(options);
				}).then(() => {
					return deferred.resolve();
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static recover(options) {
			if (options == null) {options = {};}
			const deferred = Q.defer();

			const attrs = {};
			attrs[this.options.deletedAt] = null;

			Q(this.update(attrs, options))
				.then(() => {
					return this.sphinxReIndexOnBulkUpdate(options);
				}).then(() => {
					return deferred.resolve();
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static loadLayoutsTemplates(siteId, langId, view) {
			const deferred = Q.defer();

			const tpls = [];

			this.sequelize.sql('\
select \
page.page_id, \
page.type \
from \
page \
inner join menu_item_rel using (page_id) \
where \
page.lang_id = :langId \
and page.site_id = :siteId \
group by page.page_id \
limit 10\
', {
				langId,
				siteId
			})
				.then(pages => {
					let f = Q();

					for (let page of Array.from(pages)) {
						(page => {
							//@ts-ignore
							const {type, page_id} = page;
							return f = f.then(() => {
								let file;
								const def = Q.defer();

								switch (type) {
									case 'landing':
										file = `$landings/page${page_id}`;
										break;
									default:
										file = `$pages/page${page_id}`;
								}

								const tpl = {
									type: 'layout',
									file
								};

								view.localCompileClient(tpl.type, tpl.file)
									.then(res => {
										tpl.tpl = res;
										tpls.push(tpl);

										return def.resolve();
									}).done();

								return def.promise;
							});
						})(page);
					}

					return f;
				}).then(() => {
					return deferred.resolve(tpls);
				});

			return deferred.promise;
		}

		static createUrlKeyByTitle(siteId, lang, title, pk = null) {
			const urlKey = speakingUrl(title, {
				lang: lang.alias
			});

			return this.findUniqueUrl(siteId, lang.lang_id, urlKey, pk);
		}

		static findUniqueUrl(siteId, langId, urlKey, pk = null, suffix = null) {
			const deferred = Q.defer();

			let checkingUrl = urlKey;
			if (suffix) {
				checkingUrl += `-${suffix}`;
			} else {
				suffix = 0;
			}

			const where = {
				site_id: siteId,
				lang_id: langId,
				url_key: checkingUrl
			};

			if (pk) {
				where.page_id =
					{[Op.ne]: pk};
			}

			this.sequelize.model('page').findOne({
				where
			})
				.then(row => {
					if (row) {
						return this.findUniqueUrl(siteId, langId, urlKey, pk, ++suffix);
					} else {
						return checkingUrl;
					}
				}).then(res => deferred.resolve(res)).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}
	}

	Page.init({
		page_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		parent_id: {
			allowNull: true,
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.ENUM('page', 'folder')
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		system_alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		url_key: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		typearea_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		route_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'page',
		deletedAt: 'deleted_at',
		modelName: 'page',
		sequelize
	});

	return Page;
}