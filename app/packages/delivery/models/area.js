import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Area extends ExtendedModel {
		static findOptions(langId, regionId, out) {
			if (out == null) {out = [];}
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
area_id, \
title \
from \
area \
inner join area_text using(area_id) \
where \
region_id = :region \
and deleted_at is null \
and lang_id = :lang \
order by \
title asc\
', {
				region: regionId,
				lang: langId
			})
				.then(rows => {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.area_id, row.title]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}

		static findOrCreateArea(countryId, langId, regionProps, title) {
			const deferred = Q.defer();

			let region = null;
			let area = null;
			//@ts-ignore
			this.sequelize.model('region').findOrCreateRegion(countryId, langId, regionProps.title, regionProps.vkId)
				.then(result => {
					region = result;

					return this.sequelize.model('area').findOne({
						include: [
							{
								model: this.sequelize.model('areaText'),
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
							region_id: region.region_id,
							deleted_at: null
						}
					});
				}).then(row => {
					if (row) {
						area = row;
						return Q.reject('areaExists');
					}

					return this.sequelize.model('area').create({
						region_id: region.region_id
					});
				}).then(row => {
					area = row;

					return this.sequelize.model('areaText').update({
						title
					}, {
						where: {
							region_id: region.region_id,
							lang_id: langId
						}
					});
				}).then(() => {
					return deferred.resolve(area);
				}).catch(function (e) {
					if (e === 'areaExists') {
						return deferred.resolve(area);
					} else {
						return deferred.reject(e);
					}
				}).done();

			return deferred.promise;
		}
	}

	Area.init({
		area_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		region_id: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'area',
		deletedAt: 'deleted_at',
		modelName: 'area',
		sequelize
	});

	return Area;
}