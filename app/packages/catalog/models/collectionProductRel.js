import ExtendedModel from '../../../modules/db/model';
import {Op} from 'sequelize';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class CollectionProductRel extends ExtendedModel {
		static saveSort(collectionId, products) {
			const funcs = [];
			for (let i = 0; i < products.length; i++) {
				const productId = products[i];
				const f = ((productId, i) => {
					return () => {
						return Q(this.update({
							sort: i * 10
						}, {
							where: {
								collection_id: collectionId,
								product_id: productId
							}
						}));
					};
				}
				)(productId, i);

				funcs.push(f);
			}

			let result = Q();
			funcs.forEach(f => result = result.then(f));

			return result;
		}

		static addOnce(collectionId, productId) {
			return this.sequelize.sql('\
insert into collection_product_rel \
(collection_id, product_id, sort) \
select \
:collectionId, \
:productId, \
coalesce(max(sort), 0) + 10 \
from \
collection_product_rel \
where \
collection_id = :collectionId \
on conflict (collection_id, product_id) do nothing\
', {
				collectionId,
				productId
			});
		}

		static setProductCollections(productId, collections) {
			if (collections == null) {collections = [];}
			let f = Q();
			for (let collectionId of Array.from(collections)) {
				(collectionId => {
					return f = f.then(() => {
						return this.addOnce(collectionId, productId);
					});
				})(collectionId);
			}

			return f.then(() => {
				const where =
					{product_id: productId};

				if (collections.length > 0) {
					where.collection_id =
						{[Op.notIn]: collections};
				}

				return this.destroy({
					where
				});
			})
				.then(() => {
				});
		}
	}

	CollectionProductRel.init({
		rel_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		collection_id: {
			type: DataTypes.INTEGER
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		sort: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'collection_product_rel',
		modelName: 'collectionProductRel',
		sequelize
	});

	return CollectionProductRel;
}