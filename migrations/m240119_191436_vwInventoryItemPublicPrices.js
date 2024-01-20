import BasicMigration from '../app/modules/migrate/components/basicMigration';

export default class Migration extends BasicMigration {
	constructor() {
		super();

		this.applyToSample = true;
		this.applyToWrapper = false;
		this.applyToInstances = true;
	}

	async up(db, type, instanceRegistry = null) {
		await db.sql('create index on price (is_public, deleted_at)');

		await db.sql('drop view if exists vw_inventory_item');

		await db.sql(`
			CREATE VIEW vw_inventory_item AS
			SELECT
				inventory_item.item_id,
				CASE
					WHEN custom_item.custom_item_id IS NOT NULL THEN 'custom_item'::text
					WHEN variant.variant_id IS NOT NULL THEN 'variant'::text
					ELSE 'product'::text
				END AS type,
				CASE
					WHEN track_inv_setting.value IS FALSE OR custom_item.custom_item_id IS NOT NULL THEN false
					WHEN COALESCE(_v_commodity_group.not_track_inventory, commodity_group.not_track_inventory) IS NOT NULL AND COALESCE(_v_commodity_group.not_track_inventory, commodity_group.not_track_inventory) IS TRUE THEN false
					ELSE true
				END AS track_inventory,
				inventory_item.available_qty,
				inventory_item.reserved_qty,
				COALESCE(_v_product.product_id, product.product_id) AS product_id,
				inventory_item.variant_id,
				inventory_item.custom_item_id,
				COALESCE(_v_product.status, product.status) AS status,
				COALESCE(_v_product.deleted_at, product.deleted_at) AS deleted_at,
				COALESCE(variant_text.lang_id, product_text.lang_id) AS lang_id,
				json_build_object('product_id', COALESCE(_v_product.product_id, product.product_id), 'sku', COALESCE(_v_product.sku, product.sku), 'has_variants', COALESCE(_v_product.has_variants, product.has_variants), 'title', COALESCE(_v_product_text.title, product_text.title), 'url_key', COALESCE(_v_product_text.url_key, product_text.url_key), 'default_category_id', COALESCE(_v_product_category_rel.category_id, product_category_rel.category_id), 'manufacturer_id', COALESCE(_v_product.manufacturer_id, product.manufacturer_id), 'tax_status', COALESCE(_v_product_prop.tax_status, product_prop.tax_status), 'tax_class_id', COALESCE(_v_product_prop.tax_class_id, product_prop.tax_class_id)) AS product,
				json_build_object('variant_id', inventory_item.variant_id, 'sku', variant.sku, 'title', variant_text.title, 'cases', variant.cases, 'size', variant.size) AS variant,
				json_build_object('custom_item_id', custom_item.custom_item_id, 'title', custom_item.title, 'price', custom_item.price) AS custom_item,
				json_build_object('group_id', COALESCE(_v_product.group_id, product.group_id), 'type', COALESCE(_v_commodity_group.type, commodity_group.type), 'not_track_inventory', COALESCE(_v_commodity_group.not_track_inventory, commodity_group.not_track_inventory), 'vat', COALESCE(_v_commodity_group.vat, commodity_group.vat), 'physical_products', COALESCE(_v_commodity_group.physical_products, commodity_group.physical_products), 'title', COALESCE(_v_commodity_group_text.title, commodity_group_text.title)) AS commodity_group,
				json_build_object('path', COALESCE(_v_image.path, image.path), 'width', COALESCE(_v_image.width, image.width), 'height', COALESCE(_v_image.height, image.height)) AS image,
				compiled_prices.prices
			FROM
				inventory_item
				LEFT JOIN product ON product.product_id = inventory_item.product_id
				LEFT JOIN product_text ON product_text.product_id = product.product_id
				LEFT JOIN product_prop ON product_prop.product_id = product.product_id
				LEFT JOIN commodity_group ON commodity_group.group_id = product.group_id
				LEFT JOIN commodity_group_text ON commodity_group_text.group_id = commodity_group.group_id AND commodity_group_text.lang_id = product_text.lang_id
				LEFT JOIN product_image ON product_image.product_id = product.product_id AND product_image.is_default IS TRUE
				LEFT JOIN image ON image.image_id = product_image.image_id
				LEFT JOIN product_category_rel ON product_category_rel.product_id = product.product_id AND product_category_rel.is_default IS TRUE
				LEFT JOIN variant ON variant.variant_id = inventory_item.variant_id
				LEFT JOIN variant_text ON variant.variant_id = variant_text.variant_id
				LEFT JOIN product _v_product ON _v_product.product_id = variant.product_id
				LEFT JOIN product_text _v_product_text ON _v_product_text.product_id = _v_product.product_id AND _v_product_text.lang_id = variant_text.lang_id
				LEFT JOIN product_prop _v_product_prop ON _v_product_prop.product_id = _v_product.product_id
				LEFT JOIN commodity_group _v_commodity_group ON _v_commodity_group.group_id = _v_product.group_id
				LEFT JOIN commodity_group_text _v_commodity_group_text ON _v_commodity_group_text.group_id = _v_commodity_group.group_id AND _v_commodity_group_text.lang_id = variant_text.lang_id
				LEFT JOIN product_image _v_product_image ON _v_product_image.product_id = _v_product.product_id AND _v_product_image.is_default IS TRUE
				LEFT JOIN image _v_image ON _v_image.image_id = _v_product_image.image_id
				LEFT JOIN product_category_rel _v_product_category_rel ON _v_product_category_rel.product_id = _v_product.product_id AND _v_product_category_rel.is_default IS TRUE
				LEFT JOIN (
					SELECT
						final_price.item_id,
						json_build_object('point_id', json_agg(final_price.point_id), 'price_id', json_agg(final_price.price_id), 'alias', json_agg(price.alias), 'currency_id', json_agg(final_price.currency_id), 'currency_alias', json_agg(currency.alias), 'value', json_agg(final_price.value), 'min', json_agg(final_price.min), 'max', json_agg(final_price.max), 'is_auto_generated', json_agg(final_price.is_auto_generated), 'old', json_agg(final_price.old), 'old_min', json_agg(final_price.old_min), 'old_max', json_agg(final_price.old_max)) AS prices
					FROM
						final_price
						JOIN price USING (price_id)
						JOIN currency USING (currency_id)
					where
						price.is_public is true
						and deleted_at is null
					GROUP BY final_price.item_id
				) compiled_prices ON inventory_item.item_id = compiled_prices.item_id
				LEFT JOIN custom_item ON custom_item.custom_item_id = inventory_item.custom_item_id,
				( SELECT setting.value::text::boolean AS value
				FROM setting
				WHERE setting.setting_group = 'inventory'::setting_group AND setting.key = 'trackInventory'::citext) track_inv_setting
				WHERE variant.variant_id IS NOT NULL OR product.has_variants IS FALSE OR custom_item.custom_item_id IS NOT NULL
		`);

		await this.grantPrivileges(db, instanceRegistry);
	}
}