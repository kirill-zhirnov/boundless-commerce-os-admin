import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CrossSell extends ExtendedModel {
		static async setRelation(categoryId, productId, relProductId) {
			await this.sequelize.sql(`
				insert into cross_sell
					(category_id, product_id, rel_product_id)
				values
					(:category, :product, :relProduct)
				on conflict do nothing
			`, {
				category: categoryId,
				product: productId,
				relProduct: relProductId
			});

			return;
		}
	}

	CrossSell.init({
		cross_sell_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		category_id: {
			type: DataTypes.INTEGER,
		},

		product_id: {
			type: DataTypes.INTEGER,
		},

		rel_product_id: {
			type: DataTypes.INTEGER,
		},

		sort: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'cross_sell',
		modelName: 'crossSell',
		sequelize
	});

	return CrossSell;
}