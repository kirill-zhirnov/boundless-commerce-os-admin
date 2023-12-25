import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class ProductCategoryRel extends ExtendedModel {
		static setProductCategories(productId, categories) {
			if (!Array.isArray(categories)) {
				categories = [];
			}

			let savedCategories = [];
			let f = Q();
			categories.forEach(categoryId => {
				return f = f.then(() => {
					return this.addProductToCategory(productId, categoryId)
						.then(parentCategories => {
							savedCategories.push(categoryId);
							savedCategories = savedCategories.concat(parentCategories);

						});
				});
			});


			return f.then(() => {
				if (savedCategories.length > 0) {
					return this.sequelize.sql(`\
delete from product_category_rel \
where \
product_id = :product \
and category_id not in (${this.sequelize.escapeIn(savedCategories)})\
`, {
						product: productId
					});
				}
			});
		}

		static addProductToCategory(productId, categoryId) {
			let parentCategories = [];

			//				at this stage add only categories without children
			return this.sequelize.sql('\
insert into product_category_rel \
(category_id, product_id) \
select \
category_id, \
:product \
from \
category \
where \
category_id = :category \
on conflict do nothing\
', {
				category: categoryId,
				product: productId
			})
				.then(() => {
					return this.sequelize.sql('\
select \
category_id \
from \
category_get_parents(:category) \
where \
category_id != :category\
', {
						category: categoryId
					});
				})
				.then(rows => {
					parentCategories = _.pluck(rows, 'category_id');

					if (parentCategories.length > 0) {
						return this.sequelize.sql(`\
insert into product_category_rel \
(category_id, product_id) \
select \
category_id, \
:product \
from \
category \
where \
category_id in (${parentCategories.join(', ')}) \
on conflict do nothing\
`, {
							product: productId
						});
					}
				})
				.then(() => {
					return parentCategories;
				});
		}

		static rmProductFromCategory(productId, categoryId) {
			let parentId = null;
			return this.sequelize.sql('\
delete from product_category_rel \
where \
category_id = :categoryId \
and product_id = :productId\
', {
				productId,
				categoryId
			})
				.then(() => {
					return this.sequelize.sql('\
select parent_id from category where category_id = :category\
', {
						category: categoryId
					});
				})
				.then(rows => {
					//@ts-ignore
					parentId = rows[0].parent_id;

					if (parentId) {
						return this.sequelize.sql('\
select \
category_id \
from \
product_category_rel \
where \
product_id = :productId \
and category_id in ( \
select \
category_id \
from \
category \
where \
parent_id = :parent \
and deleted_at is null \
) \
limit 1\
', {
							productId,
							parent: parentId
						});
					}
				})
				.then(rows => {
					if (parentId && !rows.length) {
						return this.rmProductFromCategory(productId, parentId);
					}
				});
		}

		// remove categories products from parents categories. Use when changing parents
		// in category (see category.changeParent method)
		//
		// removeFromId - id of parent category
		static removeCategoryProductsFromParents(categoryIdWithProducts, removeFromId) {
			return this.sequelize.sql('\
delete from product_category_rel \
where \
category_id = :removeFromId \
and product_id in ( \
select product_id from product_category_rel where category_id = :categoryId \
) \
and product_id not in ( \
select \
product_id \
from \
product_category_rel \
where \
category_id in ( \
select \
category_id \
from \
category \
where \
parent_id = :removeFromId \
and category_id != :categoryId \
) \
)\
', {
				removeFromId,
				categoryId: categoryIdWithProducts
			})
				.then(() => {
					return this.sequelize.sql('\
select parent_id from category where category_id = :removeFromId\
', {
						removeFromId
					});
				})
				.then(rows => {
					//@ts-ignore
					const {parent_id} = rows[0];
					if (parent_id) {
						return this.removeCategoryProductsFromParents(categoryIdWithProducts, parent_id);
					}

				});
		}

		static addCategoryProductsToParents(categoryIdWithProducts, addToCategoryId) {
			return this.sequelize.sql('\
insert into product_category_rel \
(category_id, product_id) \
select \
distinct \
parents.category_id, \
product_category_rel.product_id \
from \
category_get_parents(:addToCategoryId) as parents, \
product_category_rel \
where \
product_category_rel.category_id = :categoryIdWithProducts \
on conflict do nothing\
', {
				addToCategoryId,
				categoryIdWithProducts
			});
		}
	}

	ProductCategoryRel.init({
		category_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		product_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		is_default: {
			type: DataTypes.BOOLEAN
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'product_category_rel',
		modelName: 'productCategoryRel',
		sequelize
	});

	return ProductCategoryRel;
}