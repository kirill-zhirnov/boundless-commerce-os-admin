import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
import _ from 'underscore';
import * as thumbnailUrl from '../modules/thumbnail/url';
import speakingUrl from 'speakingurl';
import validator from '../../../modules/validator/validator';
import moment from 'moment';
import {Op} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Article extends ExtendedModel {
		static loadArticle(instanceRegistry, siteId, langId, articleId) {
			const deferred = Q.defer();

			this.sequelize.sql(`\
select \
article.article_id, \
article.title, \
article.date, \
article.url_key, \
article.announcement, \
article.content, \
article.status, \
article.created_by, \
article.created_at, \
article.deleted_at, \
image.image_id, \
image.path, \
image.width, \
image.height, \
person_profile.person_id, \
person_profile.first_name, \
person_profile.last_name, \
person_profile.patronymic \
from \
article \
left join person_profile on article.created_by = person_profile.person_id \
left join image using(image_id) \
where \
article.site_id = :site \
and article.lang_id = :lang \
and article.deleted_at is null \
and ${validator.isNumeric(articleId) ? 'article_id' : 'url_key'} = :article\
`, {
				site: siteId,
				lang: langId,
				article: articleId
			})
				.then(rows => {
					let article = null;

					if (rows[0]) {
						article = _.pick(rows[0], [
							'article_id',
							'title',
							'date',
							'url_key',
							'announcement',
							'content',
							'image_id',
							'status',
							'created_by',
							'created_at',
							'deleted_at'
						]);

						//@ts-ignore
						const {date, image_id, created_by} = article;

						//@ts-ignore
						article.image = null;
						if (image_id) {
							//@ts-ignore
							article.image = {
								xs: thumbnailUrl.getAttrs(instanceRegistry, rows[0], 'scaled', 'xs'),
								s: thumbnailUrl.getAttrs(instanceRegistry, rows[0], 'scaled', 's'),
								m: thumbnailUrl.getAttrs(instanceRegistry, rows[0], 'scaled', 'm')
							};
						}

						const momentDate = moment(date);
						//@ts-ignore
						article.date = momentDate.format('DD.MM.YYYY HH:mm');
						//@ts-ignore
						article.dateISO = momentDate.format();

						if (created_by) {
							//@ts-ignore
							article.author = this.sequelize.model('person').getFullNameByRow(rows[0]);
						}
					}

					return deferred.resolve(article);
				});

			return deferred.promise;
		}

		static createUrlKeyByTitle(title, langAlias, pk = null) {
			const urlKey = speakingUrl(title, {
				lang: langAlias
			});

			return this.findUniqueUrl(urlKey, pk);
		}

		static findUniqueUrl(urlKey, pk = null, suffix = null) {
			const deferred = Q.defer();

			let checkingUrl = urlKey;
			if (suffix) {
				checkingUrl += `-${suffix}`;
			} else {
				suffix = 0;
			}

			const where =
				{url_key: checkingUrl};

			if (pk) {
				where.article_id =
					{[Op.ne]: pk};
			}

			this.sequelize.model('article').findOne({
				where
			})
				.then(row => {
					if (row) {
						return this.findUniqueUrl(urlKey, pk, ++suffix);
					} else {
						return checkingUrl;
					}
				}).then(res => deferred.resolve(res)).catch(e => deferred.reject(e)).done();

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
								return this.sphinxReIndex(row.article_id);
							});
						})(row);
					}

					return f;
				}).then(() => {
					return deferred.resolve();
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static sphinxReIndex(articleId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select sphinx_replace_article(:articleId)\
', {
				articleId
			})
				.then(() => deferred.resolve()).catch(() => //                    console.error e
					deferred.resolve());

			return deferred.promise;
		}
	}

	Article.init({
		article_id: {
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

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		url_key: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		date: {
			type: DataTypes.DATE,
			allowNull: true
		},

		announcement: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		content: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		image_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		status: {
			type: DataTypes.ENUM(
				'draft',
				'published',
				'hidden'
			)
		},

		created_by: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'article',
		deletedAt: 'deleted_at',
		modelName: 'article',
		sequelize
	});

	return Article;
}