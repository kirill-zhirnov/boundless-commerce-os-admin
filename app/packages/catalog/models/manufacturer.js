import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
import speakingUrl from 'speakingurl';
import {Op} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Manufacturer extends ExtendedModel {
		static loadManufacturer(manufacturerId, langId) {
			const url = String(manufacturerId);
			let id = parseInt(manufacturerId);
			id = isNaN(id) ? 0 : id;

			return this.sequelize.sql('\
select \
* \
from \
manufacturer \
inner join manufacturer_text using(manufacturer_id) \
where \
(manufacturer_id = :id or url_key = :url) \
and deleted_at is null \
and lang_id = :lang\
', {
				id,
				url,
				lang: langId
			})
				.then(rows => rows[0]);
		}

		static async findOptions(langId, out = []) {
			const rows = await this.findAll({
				include: [{
					model: sequelize.model('manufacturerText'),
					where: {
						lang_id: langId
					}
				}],
				where: {
					deleted_at: null
				},
				order: [
					[this.sequelize.model('manufacturerText'), 'title', 'ASC']
				]
			});

			for (const row of rows) {
				//@ts-ignore
				out.push([row.manufacturer_id, row.manufacturerTexts[0].title]);
			}

			return out;
		}

		static createByTitle(title, langId) {
			const deferred = Q.defer();

			let row = null;

			Q(this.sequelize.model('manufacturer').build().save())
				.then(result => {
					row = result;

					return this.sequelize.model('manufacturerText').update({
						title
					}, {
						where: {
							manufacturer_id: row.manufacturer_id,
							lang_id: langId
						}
					});
				})
				.then(() => {
					return this.sphinxReIndex(row.manufacturer_id, false);
				}).then(() => {
					return deferred.resolve(row);
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static findOrCreateByTitle(title, langId) {
			const deferred = Q.defer();
			//changed find() to findOne()
			Q(this.sequelize.model('manufacturerText').findOne({
				where: {
					lang_id: langId,
					title
				},

				include: [
					{
						model: this.sequelize.model('manufacturer')
					}
				]
			}))
				.then(row => {
					if (row) {
						return row.manufacturer;
					} else {
						return this.createByTitle(title, langId);
					}
				}).then(row => {
					return deferred.resolve(row);
				}).catch(e => {
					return deferred.reject(e);
				}).done();

			return deferred.promise;
		}

		static sphinxReIndex(manufacturerId, reIndexProducts) {
			if (reIndexProducts == null) {reIndexProducts = true;}
			const deferred = Q.defer();

			this.sequelize.sql('\
select sphinx_replace_manufacturer(:manufacturerId, :reIndexProducts)\
', {
				manufacturerId,
				reIndexProducts
			})
				.then(() => {
					return deferred.resolve();
				}).catch(() => //                    console.error e
					deferred.resolve());

			return deferred.promise;
		}

		static sphinxReIndexAll(options, reIndexProducts) {
			if (options == null) {options = {};}
			if (reIndexProducts == null) {reIndexProducts = true;}
			const deferred = Q.defer();

			Q(this.findAll(options))
				.then(rows => {
					let f = Q();

					for (let row of Array.from(rows)) {
						(row => {
							return f = f.then(() => {
								return this.sphinxReIndex(row.manufacturer_id, reIndexProducts);
							});
						})(row);
					}

					return f;
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
					return this.sphinxReIndexAll(options, true);
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
					return this.sphinxReIndexAll(options, true);
				}).then(() => {
					return deferred.resolve();
				}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static getCacheKey() {
			return 'manufacturers';
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

			const where =
				{url_key: checkingUrl};

			if (pk) {
				where.manufacturer_id =
					{[Op.ne]: pk};
			}

			return this.sequelize.model('manufacturerText').findOne({
				where
			})
				.then(row => {
					if (row) {
						return this.findUniqueUrl(urlKey, pk, ++suffix);
					} else {
						return checkingUrl;
					}
				}).then(res => res);
		}
	}

	Manufacturer.init({
		manufacturer_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},

		layout: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		created_by: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		deleted_at: {
			type: DataTypes.DATE
		},

		image_id: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'manufacturer',
		deletedAt: 'deleted_at',

		scopes: {
			byTitleAsc: {
				order: 'title asc'
			}
		},
		//@ts-ignore
		optionsSettings: {
			key: 'unit_id',
			title: 'title',
			scopes: ['byTitleAsc']
		},
		modelName: 'manufacturer',
		sequelize
	});

	return Manufacturer;
}