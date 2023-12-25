const BasicCommand = require('../../../modules/commands/basic');
const wrapperBootstrap = require('../../../modules/bootstrap/wrapper');
const instances = require('../../../modules/instances');

class ProductCommand extends BasicCommand {
	async actionFixCategoryTree() {
		const instanceId = this.getOption('instance');

		const bootstrapInstance = await wrapperBootstrap('bootstrapInstance', instanceId);
		const instanceRegistry = bootstrapInstance.getInstanceRegistry();
		const db = instanceRegistry.getDb();

		const products = await db.model('product').findAll({
			where: {
				deleted_at: null
			}
		});

		console.log('product length:', products.length);
		for (const product of products) {
			const categories = await db.sql('select category_id from product_category_rel where product_id = :product', {product: product.product_id});
			const endCategories = [];

			for (const category of categories) {
				const categoryChildren = await db.model('category').loadChildren(category.category_id);

				if (categoryChildren.length == 0) {
					endCategories.push(category.category_id);
				}
			}

			console.log('set relations for', product.product_id);
			await db.model('productCategoryRel').setProductCategories(product.product_id, endCategories);
		}
	}
}

module.exports = ProductCommand;