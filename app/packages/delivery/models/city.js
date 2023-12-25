import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
import {Sequelize} from 'sequelize';

export default function (sequelize, DataTypes) {
	class City extends ExtendedModel {
		static loadCity(cityId, langId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
* \
from \
vw_city c \
where \
c.city_id = :city \
and c.lang_id = :lang\
', {
				city : cityId,
				lang : langId
			})
				.then(rows => {
					const row = rows[0];
					//@ts-ignore
					row.common_title = this.createCommonTitle(row);

					return deferred.resolve(row);
				});

			return deferred.promise;
		}

		static createCommonTitle(row) {
			let commonTitle;
			if (row.custom_city) {
				commonTitle = [row.custom_city];

				if (row.custom_region_title) {
					commonTitle.push(row.custom_region_title);
				}
			} else {
				commonTitle = [row.city_title];

				if (row.area_title) {
					commonTitle.push(row.area_title);
				}

				if (row.region_title) {
					commonTitle.push(row.region_title);
				}
			}

			return commonTitle.join(',');
		}

		static refreshCityDeliveryView() {
			const deferred = Q.defer();

			Q()
				.then(() => {
					return this.sequelize.sql('REFRESH MATERIALIZED VIEW CONCURRENTLY vw_delivery_city');
				}).then(() => {
				return this.sequelize.sql('REFRESH MATERIALIZED VIEW CONCURRENTLY vw_delivery_country');
			}).then(() => {
				return deferred.resolve();
			}).catch(e => deferred.reject(e)).done();

			return deferred.promise;
		}

		static findOrCreateCity(countryId, langId, regionProps, cityTitle, areaTitle = null, vkId = null, isImportant) {
			if (isImportant == null) { isImportant = false; }
			const deferred = Q.defer();

			let region = null;
			let city = null;
			let area = null;

			Q()
				.then(() => {
					if (areaTitle) {
						//@ts-ignore
						return this.sequelize.model('area').findOrCreateArea(countryId, langId, regionProps, areaTitle);
					}

					return null;
				}).then(row => {
				if (row) {
					area = row;
					return this.sequelize.model('region').findOne({
						where: {
							region_id: area.region_id
						}
					});
				} else {
					//@ts-ignore
					return this.sequelize.model('region').findOrCreateRegion(countryId, langId, regionProps.title, regionProps.vkId);
				}
			}).then(row => {
				region = row;

				const where = {
					country_id : countryId,
					region_id : region.region_id
				};

				if (area) {
					where.area_id = area.area_id;
				}

				return this.sequelize.model('city').findOne({
					include : [
						{
							required : true,
							//@ts-ignore
							model : this.sequelize.model('cityText'),
							where : {
								lang_id : langId,
								$and: [
									//@ts-ignore
									Sequelize.where(
										Sequelize.fn('lower', Sequelize.col('title')),
										cityTitle.toLowerCase()
									)
								]
							}
						}
					],
					where
				});
			}).then(row => {
				if (row) {
					city = row;
					return Q.reject('cityExists');
				}

				return this.sequelize.model('city').create({
					country_id: countryId,
					region_id: region.region_id,
					area_id: area ? area.area_id : null,
					vk_id: vkId,
					is_important: isImportant
				});
			})
				.then(row => {
					city = row;

					return this.sequelize.model('cityText').update({
						title : cityTitle
					}, {
						where : {
							city_id : city.city_id,
							lang_id : langId
						}
					});
				})
				.then(() => {
					return deferred.resolve(city);
				}).catch(function(e) {
				if (e === 'cityExists') {
					return deferred.resolve(city);
				} else {
					return deferred.reject(e);
				}}).done();

			return deferred.promise;
		}
	}

	City.init({
		city_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		country_id: {
			type: DataTypes.INTEGER
		},

		region_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		area_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		vk_id : {
			type: DataTypes.BIGINT,
			allowNull: true
		},

		is_important : {
			type: DataTypes.BOOLEAN
		},

		vk_no_region : {
			type: DataTypes.BOOLEAN
		},

		kladr_id: {
			type: DataTypes.STRING(19)
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'city',
		deletedAt: 'deleted_at',
		modelName: 'city',
		sequelize
	});
}