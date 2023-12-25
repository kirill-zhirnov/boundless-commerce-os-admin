import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class OrderSource extends ExtendedModel {
		static findOptions(langId, out) {
			if (out == null) {out = [];}
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
source_id, \
title \
from \
order_source \
inner join order_source_text using(source_id) \
where \
lang_id = :lang \
and deleted_at is null \
order by \
sort\
', {
				lang: langId
			})
				.then(rows => {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.source_id, row.title]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}

		static findByAlias(alias, langId) {
			return this.sequelize.sql('\
select \
* \
from \
order_source \
inner join order_source_text using(source_id) \
where \
alias = :alias \
and lang_id = :lang \
and deleted_at is null\
', {
				alias,
				lang: langId
			})
				.then(rows => {
					return rows[0];
				});
		}
	}

	OrderSource.init({
		source_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'order_source',
		deletedAt: 'deleted_at',
		modelName: 'orderSource',
		sequelize
	});

	return OrderSource;
}