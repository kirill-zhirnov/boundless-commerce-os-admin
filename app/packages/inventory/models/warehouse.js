import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Warehouse extends ExtendedModel {
		static createWithTxt(langId, title, address = null) {
			const deferred = Q.defer();

			let warehouse = null;
			Q(this.sequelize.model('warehouse').create())
				.then(row => {
					warehouse = row;

					return this.sequelize.model('warehouseText').update({
						title,
						address
					}, {
						where: {
							warehouse_id: warehouse.warehouse_id,
							lang_id: langId
						}
					});
				}).then(() => {
					return deferred.resolve(warehouse);
				}).catch(e => {
					return deferred.reject(e);
				}).done();

			return deferred.promise;
		}

		static checkWarehouseExists(i18n, langId) {
			return this.sequelize.sql('\
select \
count(*) as total \
from \
warehouse \
where \
deleted_at is null\
').then(rows => {
				//@ts-ignore
				if (parseInt(rows[0].total) === 0) {
					const title = i18n ? i18n.__('My default warehouse') : 'My default warehouse';
					return this.createWithTxt(langId, title);
				}

			});
		}

		static findOptions(langId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
warehouse_id, \
title \
from \
warehouse \
inner join warehouse_text using (warehouse_id) \
where \
lang_id = :lang \
and deleted_at is null\
', {
				lang: langId
			})
				.then(function (rows) {
					const out = [];

					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.warehouse_id, row.title]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}
	}

	Warehouse.init({
		warehouse_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
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
		tableName: 'warehouse',
		deletedAt: 'deleted_at',
		modelName: 'warehouse',
		sequelize
	});

	return Warehouse;
}