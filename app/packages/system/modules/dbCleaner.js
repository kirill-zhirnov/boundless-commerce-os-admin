import rimraf from 'rimraf';
import serverUtils from '../../../modules/utils/server';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import {promisify} from 'util';

export default class DbCleaner {
	constructor(instanceRegistry, skipUserIds) {
		this.instanceRegistry = instanceRegistry;
		this.skipUserIds = skipUserIds;
		this.db = this.instanceRegistry.getDb();
		this.cleanUpPks = null;

		this.removeFilesFromS3 = true;
	}

	async clean() {
		this.cleanUpPks = await this.instanceRegistry.getSettings().get('system', 'cleanUpPks');

		if (this.cleanUpPks) {
			await this.runDemoCleanTasks();
			await this.instanceRegistry.getSettings().set('system', 'cleanUpPks', null);
		} else {
			await this.runTaskList();
		}
	}

	runTaskList() {
		return serverUtils.runFlow(this, ([
			'cleanInventoryItem',
			'cleanCharacteristics',
			// 'cleanOneC',
			'cleanPage',
			'cleanCategory',
			'cleanPaymentTransaction',
			'cleanOrders',
			'cleanBasket',
			'cleanUsers',
			'cleanTypearea',
			'cleanWarehouse',
			// 'cleanImport',
			'cleanImage',
			'cleanCommodityGroup',
			'cleanService',
			'cleanFilter',
			'cleanCollection',
			'cleanManufacturer',
			'cleanProductImport',
			'cleanProductImportLog',
			'cleanMenuItem',
			'cleanDemoApi',
			'cleanProducts',
			'cleanArticles',
			'cleanCache',
			'cleanFiles',
			'cleanCronTasks',
			'cleanEssences'
		])
		);
	}

	runDemoCleanTasks() {
		return serverUtils.runFlow(this, ([
			'cleanDemoCategories',
			'cleanDemoOrders',
			'cleanDemoUsers',
			'cleanDemoProducts',
			'cleanCommodityGroup',
			'cleanService',
			'cleanFilter',
		]));
	}

	async cleanInventoryItem() {
		await this.cleanTable('inventory_movement');
		await this.cleanTable('reserve');
		await this.cleanTable('reserve_item');
		await this.cleanTable('inventory_item');
	}

	async cleanCharacteristics() {
		await this.cleanTable('characteristic_variant_val');
		await this.cleanTable('characteristic');
	}

	cleanEssences() {
		return this.cleanTable('essence');
	}

	// cleanOneC() {
	// 	return this.cleanTable('one_c_classifier');
	// }

	cleanPage() {
		return this.cleanTable('page');
	}

	cleanCategory() {
		return this.cleanTable('category');
	}

	cleanUsers() {
		const sql = `
			delete from
				person
			where
				person_id not in (:ids)
				and is_owner is false
		`;

		return this.db.sql(sql, {ids: this.skipUserIds});
	}

	async cleanDemoUsers() {
		await this.db.sql(`
			delete from
				inventory_movement
			where
				person_id not in (:ids)
				and person_id <= :max_user_id
		`, {
			ids: this.skipUserIds,
			max_user_id: this.cleanUpPks.max_user_id
		});

		await this.db.sql(`
			delete from
				person
			where
				person_id not in (:ids)
				and person_id <= :max_user_id
		`, {
			ids: this.skipUserIds,
			max_user_id: this.cleanUpPks.max_user_id
		});
	}

	cleanDemoCategories() {
		const sql = `
			delete from
				category
			where
				category_id <= :max_category_id
		`;

		return this.db.sql(sql, {
			max_category_id: this.cleanUpPks.max_category_id
		});
	}

	cleanDemoOrders() {
		const sql = `
			delete from
				orders
			where
				order_id <= :max_order_id
		`;

		return this.db.sql(sql, {
			max_order_id: this.cleanUpPks.max_order_id
		});
	}

	async cleanDemoProducts() {
		const {max_product_id} = this.cleanUpPks;

		await this.cleanProductImages(max_product_id);

		let where = '';
		const params = {};
		if (max_product_id) {
			where = 'where product_id <= :max_product_id';
			Object.assign(params, {max_product_id});
		}

		await this.db.sql(`
			delete from product ${where}
		`, params);
	}

	async cleanProductImages(maxProductId = null) {
		let where = '';
		const params = {};
		if (maxProductId) {
			where = 'where product.product_id <= :max_product_id';
			Object.assign(params, {max_product_id: maxProductId});
		}

		const images = await this.db.sql(`
			select
				image.image_id,
				image.path
			from
				product
			left join product_image using (product_id)
			left join image on image.image_id = product_image.image_id
			${where}
		`, params);

		if (!images || !images.length) return;

		//@ts-ignore
		await this.db.model('image').bulkImageRm(images, this.instanceRegistry, this.removeFilesFromS3);
	}

	cleanTypearea() {
		return this.cleanTable('typearea');
	}

	cleanWarehouse() {
		return this.cleanTable('warehouse');
	}

	cleanPaymentTransaction() {
		return this.cleanTable('payment_transaction');
	}

	cleanOrders() {
		return this.cleanTable('orders');
	}

	cleanBasket() {
		return this.cleanTable('basket');
	}

	cleanImport() {
		return this.cleanTable('import');
	}

	async cleanImage() {
		const images = await this.db.sql(`
			select
				image_id,
				path
			from
				image
		`);

		if (!images || !images.length) return;

		//@ts-ignore
		await this.db.model('image').bulkImageRm(images, this.instanceRegistry, this.removeFilesFromS3);

		// return this.cleanTable('image');
	}

	cleanCommodityGroup() {
		return this.cleanTable('commodity_group');
	}

	cleanService() {
		return this.db.sql(`
			delete from
				service
			where
				alias is null
		`);
	}

	cleanFilter() {
		return this.cleanTable('filter');
	}

	cleanCollection() {
		return this.db.sql(`
			delete from
				collection
			where
				alias is null
		`);
	}

	cleanManufacturer() {
		return this.cleanTable('manufacturer');
	}

	cleanProductImport() {
		return this.cleanTable('product_import');
	}

	cleanProductImportLog() {
		return this.cleanTable('product_import_log');
	}

	cleanMenuItem() {
		return this.cleanTable('menu_item');
	}

	cleanDemoApi() {
		return this.db.model('delivery').deleteDemoApi();
	}

	cleanProducts() {
		return this.cleanTable('product');
	}

	cleanArticles() {
		return this.cleanTable('article');
	}

	async cleanFiles() {
		const path = this.instanceRegistry.getMediaPath();

		await this.cleanDir(`${path}/data/*`);
		await this.cleanDir(`${path}/public/data/*`);
	}

	async cleanDir(dir) {
		const rimrafSync = promisify(rimraf);

		await rimrafSync(dir);
	}

	cleanCache() {
		return this.instanceRegistry.getCache().clean();
	}

	async cleanTable(table) {
		await this.db.sql(`delete from ${table}`);
	}

	async cleanCronTasks() {
		//@ts-ignore
		await wrapperRegistry.getDb().model('task').safeDelete({
			where: {
				instance_id: this.instanceRegistry.getInstanceInfo().instance_id
			}
		});
	}

	setRemoveFilesFromS3(val) {
		this.removeFilesFromS3 = val;
		return this;
	}
}