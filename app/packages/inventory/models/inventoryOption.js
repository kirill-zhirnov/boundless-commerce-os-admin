import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class InventoryOption extends ExtendedModel {
		static getOptions(category, langId, out) {
			if (out == null) {out = [];}
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
o.option_id, \
t.title \
from \
inventory_option o \
inner join inventory_option_text t on o.option_id = t.option_id and t.lang_id = :lang \
where \
o.category = :category \
and o.deleted_at is null\
', {
				category,
				lang: langId
			})
				.then(function (rows) {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.option_id, row.title]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}
	}

	InventoryOption.init({
		option_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		category: {
			type: DataTypes.ENUM('changeQty', 'systemChangeQty')
		},

		alias: {
			type: DataTypes.TEXT,
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
		tableName: 'inventory_option',
		deletedAt: 'deleted_at',
		modelName: 'inventoryOption',
		sequelize
	});

	return InventoryOption;
}