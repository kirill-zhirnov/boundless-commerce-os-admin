import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Region extends ExtendedModel {
		static findOptions(langId, countryId, out) {
			if (out == null) {out = [];}
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
region_id, \
title \
from \
region \
inner join region_text using(region_id) \
where \
country_id = :country \
and deleted_at is null \
and lang_id = :lang \
order by \
title asc\
', {
				country: countryId,
				lang: langId
			})
				.then(rows => {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.region_id, row.title]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}

		static findOrCreateRegion(countryId, langId, title, vkId = null) {
			const deferred = Q.defer();

			let region = null;
			Q(this.sequelize.model('region').findOne({
				include: [
					{
						model: this.sequelize.model('regionText'),
						required: true,
						where: {
							lang_id: langId,
							$and: [
								//@ts-ignore
								this.sequelize.where(
									//@ts-ignore
									this.sequelize.fn('lower', this.sequelize.col('title')),
									title.toLowerCase()
								)
							]
						}
					}
				],
				where: {
					country_id: countryId,
					deleted_at: null
				}
			}))
				.then(row => {
					if (row) {
						region = row;
						return Q.reject('regionExists');
					}

					return this.sequelize.model('region').create({
						country_id: countryId,
						vk_id: vkId
					});
				}).then(row => {
					region = row;

					return this.sequelize.model('regionText').update({
						title
					}, {
						where: {
							region_id: region.region_id,
							lang_id: langId
						}
					});
				}).then(() => {
					return deferred.resolve(region);
				}).catch(function (e) {
					if (e === 'regionExists') {
						return deferred.resolve(region);
					} else {
						return deferred.reject(e);
					}
				}).done();

			return deferred.promise;
		}
	}

	Region.init({
		region_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		country_id: {
			type: DataTypes.INTEGER
		},

		vk_id: {
			type: DataTypes.BIGINT
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'region',
		deletedAt: 'deleted_at',
		modelName: 'region',
		sequelize
	});

	return Region;
}