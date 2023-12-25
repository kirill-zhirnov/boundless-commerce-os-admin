import Component from '../../../modules/component';
import _ from 'underscore';
import CopyVariants from './copyProduct/copyVariants';
import CompileCharacteristic from './compileCharacteristic';
import SphinxProductIndexer from '../../system/modules/sphinx/productIndexer';

export default class CopyProduct extends Component {
	constructor(env, id) {
		super(env);

		this.id = id;

		this.originalProduct = null;
		this.newProduct = null;
		this.newInventoryItem = null;
	}

	async copy() {
		const instanceId = this.getInstanceRegistry().getInstanceInfo().instance_id;
		await this.findOriginalProduct();

		let attrs = _.pick(this.originalProduct, ['manufacturer_id', 'group_id']);
		if (this.originalProduct.sku) {
			//@ts-ignore
			attrs.sku = await this.getModel('product').makeUniqueSku(this.originalProduct.sku);
		}

		//@ts-ignore
		attrs.status = 'hidden';
		this.newProduct = await this.getModel('product').create(attrs);
		this.newInventoryItem = await this.getModel('inventoryItem').findException({
			where: {
				product_id: this.newProduct.product_id
			}
		});

		await this.copyProductText(this.getEditingLang());
		console.log(`done: copyProductText, instanceId: ${instanceId}`);
		await this.copyProductImgs();
		console.log(`done: copyProductImgs, instanceId: ${instanceId}`);
		await this.copyProductProps();
		console.log(`done: copyProductProps, instanceId: ${instanceId}`);
		await this.copyCategory();
		await this.copyCollectionRels();
		await this.copyLabels();
		await this.copyProductPrices();
		await this.copyProductStock();
		await this.copyProductCharacteristic();
		console.log(`done: copyProductCharacteristic, instanceId: ${instanceId}`);
		await this.copyVariants();
		await this.copyYml();
		await this.compileCharacteristics();
		console.log(`done: compileCharacteristics, instanceId: ${instanceId}`);
		// const indexer = new SphinxProductIndexer(this.getEnv());
		// await indexer.reIndexProduct(this.newProduct.product_id);

		return this.newProduct;
	}

	async compileCharacteristics() {
		let compileCharact = new CompileCharacteristic(
			this.getEnv(),
			this.newProduct.product_id
		);

		await compileCharact.compile();
	}

	async copyYml() {
		await this.getDb().sql(`
			update
				product_yml
			set
				yml_export = original.yml_export,
				vendor_code = original.vendor_code,
				model = original.model,
				title = original.title,
				description = original.description,
				sales_notes = original.sales_notes,
				manufacturer_warranty = original.manufacturer_warranty,
				seller_warranty = original.seller_warranty,
				adult = original.adult,
				age = original.age,
				cpa = original.cpa
			from
				product_yml original
			where
				product_yml.product_id = :newProductId
				and original.product_id = :originalProductId
		`, {
			newProductId: this.newProduct.product_id,
			originalProductId: this.originalProduct.product_id
		});
	}

	async copyVariants() {
		let copyVariants = new CopyVariants(this.getEnv(), this.originalProduct, this.newProduct);
		await copyVariants.process();
	}

	async copyProductCharacteristic() {
		await this.getDb().sql(`
			insert into characteristic_product_val
				(product_id, characteristic_id, case_id)
			select
				:newProductId,
				characteristic_id,
				case_id
			from
				characteristic_product_val
			where
				product_id = :originalProductId
		`, {
			newProductId: this.newProduct.product_id,
			originalProductId: this.originalProduct.product_id
		});

		let textValues = await this.getDb().sql(`
			select
				characteristic_id,
				lang_id,
				value
			from
				characteristic_product_val
				inner join characteristic_product_val_text using(value_id)
			where
				product_id = :originalProductId
				and value is not null
		`, {
			originalProductId: this.originalProduct.product_id
		});

		for (let row of textValues) {
			await this.getModel('characteristic').setTextVal(
				this.newProduct.product_id,
				row.characteristic_id,
				row.lang_id,
				row.value
			);
		}
	}

	async copyProductProps() {
		return await this.getDb().sql(`
			update
				product_prop newProd
			set
				country_of_origin = orig.country_of_origin,
				extra = orig.extra,
				size = orig.size
			from
				product_prop orig
			where
				newProd.product_id = :newProductId
				and orig.product_id = :origProductId
		`, {
			newProductId: this.newProduct.product_id,
			origProductId: this.originalProduct.product_id
		});
	}

	async copyProductStock() {
		await this.getDb().sql(`
			insert into inventory_stock
				(location_id, item_id, supply_id, available_qty, reserved_qty)
			select
				location_id,
				:newInventoryItem,
				supply_id,
				available_qty,
				0
			from
				inventory_stock
			where
				item_id = :originalItemId
		`, {
			newInventoryItem: this.newInventoryItem.item_id,
			originalItemId: this.originalProduct.inventoryItem.item_id
		});
	}

	async copyLabels() {
		await this.getDb().sql(`
			insert into product_label_rel
				(label_id, product_id)
			select
				label_id,
				:newProductId
			from
				product_label_rel
			where
				product_id = :originalProductId
		`, {
			newProductId: this.newProduct.product_id,
			originalProductId: this.originalProduct.product_id
		});
	}

	async copyProductPrices() {
		await this.getDb().sql(`
			insert into inventory_price
				(item_id, price_id, value, currency_id, old)
			select
				:newInventoryId,
				price_id,
				value,
				currency_id,
				old
			from
				inventory_price
			where
				item_id = :oldItemId
		`, {
			newInventoryId: this.newInventoryItem.item_id,
			oldItemId: this.originalProduct.inventoryItem.item_id
		});
	}

	async copyCollectionRels() {
		return await this.getDb().sql(`
			insert into collection_product_rel
				(collection_id, product_id)
			select
				collection_id,
				:newProductId
			from
				collection_product_rel
			where
				product_id = :originalProductId
		`, {
			newProductId: this.newProduct.product_id,
			originalProductId: this.originalProduct.product_id
		});
	}

	async copyCategory() {
		return await this.getDb().sql(`
			insert into product_category_rel
				(category_id, product_id, is_default)
			select
				category_id,
				:newProductId,
				is_default
			from
				product_category_rel
			where
				product_id = :originalProductId
			order by
				is_default desc
		`, {
			newProductId: this.newProduct.product_id,
			originalProductId: this.originalProduct.product_id
		});
	}

	async copyProductImgs() {
		const imgs = await this.getModel('productImage').findAll({
			where: {
				product_id: this.originalProduct.product_id
			},
			order: [['sort', 'ASC']]
		});

		const dataPath = this.getInstanceRegistry().getDataPath();
		for (const productImg of imgs) {
			const [newImg] = await this.getModel('image').copy(productImg.image_id, dataPath, this.getInstanceRegistry());

			await this.getModel('productImage').create({
				product_id: this.newProduct.product_id,
				image_id: newImg.image_id,
				is_default: false
			});
		}
	}

	async copyProductText(lang) {
		let originalProductText = await this.getModel('productText').findOne({
			where: {
				product_id: this.originalProduct.product_id,
				lang_id: lang.lang_id
			}
		});

		let attrs = _.pick(originalProductText, [
			'custom_title',
			'custom_header',
			'meta_description',
			'description'
		]);

		//@ts-ignore
		attrs.title = this.__('%s - copy', [originalProductText.title]);
		//@ts-ignore
		attrs.url_key = await this.getModel('product').createUrlKeyByTitle(
			//@ts-ignore
			attrs.title,
			lang.code,
			this.newProduct.product_id
		);

		await this.getModel('productText').update(attrs, {
			where: {
				product_id: this.newProduct.product_id,
				lang_id: lang.lang_id
			}
		});
	}

	async findOriginalProduct() {
		this.originalProduct = await this.getModel('product').findException({
			include: [
				{
					model: this.getModel('inventoryItem')
				}
			],
			where: {
				product_id: this.id
			}
		});
	}
}