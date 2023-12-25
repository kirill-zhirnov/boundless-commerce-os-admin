import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';
import Component from '../../../../modules/component';

export default class SphinxProductIndexer extends Component {
	constructor(env) {
		super(env);

		//@ts-ignore
		this.sphinx = wrapperRegistry.getSphinx();
	}

	async reIndexAll(findOptions = {}) {
		const rows = await this.getModel('product').findAll(findOptions);

		for (const {product_id} of rows) {
			await this.reIndexProduct(product_id);
		}
	}


	async reIndexProduct(productId) {
		const rows = await this.getDb().sql(
			'select 1 from product where product_id = :id and deleted_at is null',
			{
				id: productId
			}
		);

		if (rows.length > 0) {
			await this.replaceIndex(productId);
		} else {
			await this.deleteFromIndex(productId);
		}
	}

	async replaceIndex(productId) {
		const rows = await this.getDb().sql(`
			select * from vw_search_product where local_id = :productId and lang_code = 'ru'
		`, {
			productId
		});

		if (!rows.length) {
			await this.deleteFromIndex(productId);
			return;
		}

		const prefix = this.getTblPrefix();
		const sphinxId = this.makeSphinxId(productId);
		const row = rows[0];

		await this.sphinx.sql(`
			REPLACE INTO ${prefix}babylonAdminProductRu
				(id, local_id, site_id, title, sku, description, variants_search, manufacturer_title, group_title, categories_title)
			VALUES
				(:id, :localId, :siteId, :title, :sku, :description, :variantsSearch, :manufacturerTitle, :groupTitle, :categoriesTitle)
		`, {
			id: sphinxId,
			localId: String(productId),
			siteId: String(row.site_id),
			title: String(row.title),
			sku: String(row.sku),
			description: String(row.text),
			variantsSearch: String(row.variant_search),
			manufacturerTitle: String(row.manufacturer_title),
			groupTitle: String(row.group_title),
			categoriesTitle: String(row.cats_title)
		});

		await this.sphinx.sql(`
			REPLACE INTO ${prefix}babylonSiteSearchRu
				(id, local_id, site_id, type, title, sku, text, seo_title, meta, other)
			VALUES
				(:id, :localId, :siteId, :type, :title, :sku, :text, :seoTitle, :meta, :other)
		`, {
			id: sphinxId,
			localId: String(productId),
			siteId: String(row.site_id),
			type: String(row.type),
			title: String(row.title),
			sku: String(row.sku),
			text: String(row.text),
			seoTitle: String(row.seo_title),
			meta: `${row.meta_description}, ${row.meta_keywords}`,
			other: `${row.variant_search}, ${row.manufacturer_title}, ${row.cats_title}`
		});
	}

	async deleteFromIndex(productId) {
		const prefix = this.getTblPrefix();
		const id = this.makeSphinxId(productId);

		await this.sphinx.sql(`DELETE FROM ${prefix}babylonAdminProductRu WHERE id=:id`, {
			id
		});
		await this.sphinx.sql(`DELETE FROM ${prefix}babylonSiteSearchRu WHERE id=:id`, {
			id
		});
	}

	getTblPrefix() {
		return this.getInstanceRegistry().getSphinxPrefix();
	}

	makeSphinxId(productId) {
		return productId * 10 + 1;
	}
}