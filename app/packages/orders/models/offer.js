import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Offer extends ExtendedModel {
		static loadOffer(instanceRegistry, offerId) {
			const deferred = Q.defer();

			let trackInventory = null;
			instanceRegistry.getSettings().get('inventory', 'trackInventory')
				.then(val => {
					trackInventory = val;

					return this.sequelize.sql('\
select \
distinct \
offer.offer_id, \
offer.product_id, \
offer.price, \
product.has_variants, \
inventory_item.item_id, \
inventory_item.available_qty, \
commodity_group.not_track_inventory as product_not_track_inventory \
from \
offer \
inner join product using (product_id) \
inner join inventory_item using (product_id) \
left join commodity_group using (group_id) \
where \
offer_id = :offerId \
and offer.deleted_at is null\
', {
						offerId
					});
				})
				.then(rows => {
					let out;
					const row = rows[0];

					if (row) {
						//@ts-ignore
						this.sequelize.model('product').isInStock(trackInventory, row);

						out = {
							inStock: row.inStock,
							hasVariants: row.has_variants,
							itemId: row.item_id,
							offerId: row.offer_id,
							productId: row.product_id,
							price: row.price
						};
					} else {
						out = false;
					}

					return deferred.resolve(out);
				}).done();

			return deferred.promise;
		}
	}

	Offer.init({
		offer_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		price: {
			type: DataTypes.DECIMAL(20, 2)
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'offer',
		deletedAt: 'deleted_at',
		modelName: 'offer',
		sequelize
	});

	return Offer;
}