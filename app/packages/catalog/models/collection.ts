import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {ICollection} from '../../../@types/catalog';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Collection extends ExtendedModel {
		static async findOptionsWithQty(siteId: number, langId: number, out = []) {
			const rows = await this.sequelize.sql<{collection_id: number, title: string, products_qty: number}>(`
				select
					collection_id,
					title,
					count(product_id) as products_qty
				from
					collection
					left join collection_product_rel using(collection_id)
					left join product using(product_id)
				where
					collection.site_id = :site
					and collection.lang_id = :lang
					and collection.deleted_at is null
					and product.deleted_at is null
				group by
					collection_id, title
				order by
					title
			`, {
				site: siteId,
				lang: langId
			});

			for (const row of rows) {
				out.push([row.collection_id, `${row.title} (${row.products_qty})`]);
			}

			return out;
		}

		static async fetchOptions(siteId: number, langId: number, out = []) {
			const rows = await this.sequelize.sql<{collection_id: number, title: string}>(`
				select
					collection_id,
					title
				from
					collection
				where
					site_id = :site
					and lang_id = :lang
					and deleted_at is null
				order by title
			`, {
				site: siteId,
				lang: langId
			});

			for (const row of rows) {
				out.push([row.collection_id, row.title]);
			}

			return out;
		}

		static async findCollectionsByProducts(productIds, siteId, langId) {
			if (productIds.length === 0) {
				return {};
			}

			const query = `
				select
					c.collection_id,
					c.title,
					cp.product_id
				from
					collection c
					inner join collection_product_rel cp using(collection_id)
				where
					cp.product_id in (:productIds)
					and lang_id = :langId
					and site_id = :siteId
					and deleted_at is null
				order by c.title
			`;

			const collections = await this.sequelize.sql(query, {langId, siteId, productIds});
			const out = {};

			for (const collection of collections) {
				//@ts-ignore
				const {product_id} = collection;
				if (out[product_id] != null) {
					out[product_id].push(_.pick(collection, 'collection_id', 'title'));
				} else {
					out[product_id] = [_.pick(collection, 'collection_id', 'title')];
				}
			}

			return out;
		}

		static getCacheKey(id) {
			return `productCollection-${id}`;
		}
	}

	Collection.init({
		collection_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		lang_id: {
			type: DataTypes.INTEGER
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'collection',
		deletedAt: 'deleted_at',
		modelName: 'collection',
		sequelize
	});

	return Collection;
}

export interface ICollectionModel extends ExtendedModel, ICollection {
}

export type ICollectionModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICollectionModel;

	fetchOptions: (siteId: number, langId: number, out?: any[]) => Promise<(string|number)[][]>;
}