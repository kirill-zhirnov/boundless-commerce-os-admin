import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class InventoryLocation extends ExtendedModel {
		static async loadAllLocations(langId) {
			return this.sequelize.sql(`
				select
					l.location_id,
					wt.title
				from
					inventory_location l
					inner join warehouse w on w.warehouse_id = l.warehouse_id
					inner join warehouse_text wt on wt.warehouse_id = w.warehouse_id and wt.lang_id = :lang
				where
					w.deleted_at is null
				order by
					w.sort asc
			`, {
				lang: langId
			});
		}

		static async getWarehouseOptions(langId, out = []) {
			return this.loadAllLocations(langId)
				.then(function (rows) {
					for (let row of rows) {
						//@ts-ignore
						out.push([row.location_id, row.title]);
					}

					return out;
				});
		}
	}

	InventoryLocation.init({
		location_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		warehouse_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'inventory_location',
		modelName: 'inventoryLocation',
		sequelize
	});

	return InventoryLocation;
}