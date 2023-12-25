import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {ICountry, IVwCountry} from '../../../@types/delivery';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Country extends ExtendedModel {
		static async findCountryOptions(langId, out = []) {
			const rows = await this.sequelize.sql<IVwCountry>(`
				select
					country_id,
					title
				from
					vw_country
				where
					lang_id = :lang
				order by title asc
			`, {
				lang: langId
			});

			for (const row of rows) {
				out.push([row.country_id, row.title]);
			}

			return out;
		}

		/*
		static findUsedForDelivery(langId, siteId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
distinct on (country.country_id, country.title) * \
from \
vw_country country \
inner join vw_delivery_country using(country_id) \
where \
site_id = :site \
and lang_id = :lang \
order by \
country.title asc\
', {
				lang: langId,
				site: siteId
			})
				.then(rows => {
					return deferred.resolve(rows);
				});

			return deferred.promise;
		}
*/
		// static findUsedForDeliveryOptions(langId, siteId, out) {
		// 	if (out == null) {out = [];}
		// 	const deferred = Q.defer();
		//
		// 	this.findUsedForDelivery(langId, siteId)
		// 		.then(rows => {
		// 			for (let row of Array.from(rows)) {
		// 				out.push([row.country_id, row.title]);
		// 			}
		//
		// 			return deferred.resolve(out);
		// 		}).done();
		//
		// 	return deferred.promise;
		// }

		static findByTitle(langId: number, title: string): Promise<IVwCountry|null> {
			return this.sequelize.sql<IVwCountry>(`
				select
					*
				from
					vw_country
				where
					lang_id = :langId
					and lower(title) = :title
				limit 1
			`, {
				langId,
				title: String(title).toLowerCase()
			})
				.then(rows => {
					if (rows.length) {
						return rows[0];
					}

					return null;
				});
		}
	}

	Country.init({
		country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		code: {
			type: DataTypes.CHAR(2),
			allowNull: true
		},

		vk_id: {
			type: DataTypes.BIGINT,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'country',
		deletedAt: 'deleted_at',
		modelName: 'country',
		sequelize
	});

	return Country;
}

export interface ICountryModel extends ExtendedModel, ICountry {
}

export type ICountryModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICountryModel;

	findCountryOptions: (langId: number, out?: any[]) => Promise<(number|string)[]>
}