import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';

export default function (sequelize, DataTypes) {
	class InventoryStock extends ExtendedModel {
		static loadStockByInventoryItem(itemId) {
			const stock = {};
			return this.sequelize.sql('\
select \
s.location_id, \
s.item_id, \
s.available_qty, \
s.reserved_qty \
from \
inventory_stock s \
where \
s.item_id = :itemId \
and ( \
s.available_qty > 0 \
or s.reserved_qty > 0 \
)\
', {
				itemId
			})
				.then(rows => {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						const {location_id, available_qty, reserved_qty} = row;
						stock[location_id] = {
							available_qty,
							reserved_qty
						};
					}

					return stock;
				});
		}

		static loadStockByProduct(productId) {
			const stock = {};
			return this.sequelize.sql('\
select \
s.location_id, \
s.item_id, \
s.available_qty, \
s.reserved_qty \
from \
inventory_stock s \
inner join inventory_item i using(item_id) \
left join variant v using(variant_id) \
where \
( \
i.product_id = :product \
or v.product_id = :product \
) \
and \
( \
s.available_qty > 0 \
or s.reserved_qty > 0 \
)\
\
', {
				product: productId
			})
				.then(rows => {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						const {item_id, location_id, available_qty, reserved_qty} = row;
						if (_.isUndefined(stock[item_id])) {
							stock[item_id] = {};
						}

						stock[item_id][location_id] = {
							available_qty,
							reserved_qty
						};
					}

					return stock;
				});
		}
	}

	InventoryStock.init({
		stock_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		location_id: {
			type: DataTypes.INTEGER
		},

		item_id: {
			type: DataTypes.INTEGER
		},

		supply_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		available_qty: {
			type: DataTypes.INTEGER
		},

		reserved_qty: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'inventory_stock',
		modelName: 'inventoryStock',
		sequelize
	});

	return InventoryStock;
}