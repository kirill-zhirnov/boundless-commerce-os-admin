import ProductDataProvider from './product';
import _ from 'underscore';

export default class ProductCollectionDataProvider extends ProductDataProvider {
	constructor(options) {
		super(options);

		this.collection = null;
		//@ts-ignore
		this.collectionId = options.collectionId;
		//@ts-ignore
		this.collectionAlias = options.collectionAlias;

		if (this.collectionId != null) {
			this.collectionId = parseInt(this.collectionId);

			if (isNaN(this.collectionId)) {
				this.collectionId = 0;
			}
		}

		this.validPageSize = [false];
		this.defaults.perPage = false;

		this.distinctOn = 'select distinct on(p.product_id, cProdRel.sort, cProdRel.rel_id)';
	}

	async setup() {
		await super.setup();
		await this.loadCollection();
	}

	//@ts-ignore
	getData() {
		if (!this.collection) {
			return [this.getMetaResult(), []];
		}

		return super.getData();
	}

	createQuery() {
		this.createBaseQuery();

		this.q.field('rel.category_id');
		this.q.field('collection.collection_id');
		this.q.field('collection.title', 'collection_title');
		this.q.field('collection.alias', 'collection_alias');

		this.q.resetFrom();
		this.q.from('collection');

		//		# prepend product first, then prepend collection_product_rel - product will be second table
		this.q.join('product', 'p', 'p.product_id = cProdRel.product_id', 'inner', true);
		this.q.join('collection_product_rel', 'cProdRel', 'cProdRel.collection_id = collection.collection_id', 'inner', true);

		this.q.left_join('product_category_rel', 'rel', 'rel.product_id = p.product_id and rel.is_default is true');

		//@ts-ignore
		this.q.where('collection.collection_id = ?', this.collection.collection_id);
		this.q.where('p.status = \'published\' and p.deleted_at is null');
		this.q.order('cProdRel.sort asc nulls last', null);
		return this.q.order('cProdRel.rel_id');
	}

	getPageSize() {
		return false;
	}

	async prepareData(rows) {
		const result = await super.prepareData(rows);
		for (let i = 0; i < result[1].length; i++) {
			const row = result[1][i];
			result[1][i] = _.omit(row, ['collection_id', 'collection_title', 'collection_alias']);
		}

		result[2].collectionRow = this.collection;

		return result;
	}

	loadCollection() {
		const params = {
			site: this.getSite().site_id,
			lang: this.getLang().lang_id
		};

		let where = '';
		if (this.collectionId != null) {
			where = 'collection_id = :id';
			params.id = this.collectionId;
		} else if (this.collectionAlias) {
			where = 'alias = :alias';
			params.alias = this.collectionAlias;
		} else {
			throw new Error('You must pass collectionId or collectionAlias');
		}

		return this.getDb().sql(`\
select \
collection_id, \
title, \
alias \
from \
collection \
where \
site_id = :site \
and lang_id = :lang \
and ${where} \
and deleted_at is null\
`, params)
			.then(rows => {
				if (rows.length) {
					this.collection = rows[0];
				}

			});
	}

	validateCategory() {
		return true;
	}

	getSortSql() {
		return false;
	}
}