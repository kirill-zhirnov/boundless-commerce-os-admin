import * as thumbnailUrl from '../../cms/modules/thumbnail/url';
import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import speakingUrl from 'speakingurl';
import {BuildOptions, Op} from 'sequelize';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IProduct} from '../../../@types/product';
import {IProductPropModel} from './productProp';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Product extends ExtendedModel {
		static async loadProduct(instanceRegistry, productId, pointId, langId, categoryId = null, priceAlias = 'selling_price', where = '') {
			const urlKey = String(productId);
			productId = parseInt(productId);
			productId = isNaN(productId) ? 0 : productId;

			const params = {
				id: productId,
				urlKey,
				lang: langId,
				point: pointId,
				priceAlias
			};

			let categorySql = '';
			if (categoryId !== null) {
				//@ts-ignore
				params.category = categoryId;
				categorySql = 'inner join product_category_rel rel on vw.product_id = rel.product_id and rel.category_id = :category';
			}

			const sql = `
				select
					vw.*
				from
					vw_product_info vw
					${categorySql}
				where
					(
						vw.product_id = :id
						or url_key = :urlKey
					)
					and lang_id = :lang
					and deleted_at is null
					and (
						price_alias = :priceAlias or price_point_id is null
					)
					and (
						price_point_id = :point or price_point_id is null
					)
					${where}
			`;

			const [row] = await this.sequelize.sql(sql, params);

			const trackInventory = await instanceRegistry.getSettings().get('inventory', 'trackInventory');
			const imgProportion = await instanceRegistry.getSettings().get('system', 'imgProportion');

			if (row) {
				this.prepareRow(row, trackInventory, imgProportion, instanceRegistry);

				//@ts-ignore
				const labels = await this.sequelize.model('label').findLabelsByProducts([row.product_id], langId);
				//@ts-ignore
				row.labels = labels[row.product_id] || [];
			}

			return row;
		}

		static prepareRow(row, trackInventory = null, imgProportion = null, instanceRegistry = null) {
			if (Array.isArray(row.description)) {
				row.description = row.description.join('');
			}

			if (trackInventory != null) {
				this.isInStock(trackInventory, row);
			}

			if (row.price_min) {
				row.price = [row.price_min, row.price_max];
			}

			if (row.price_old_min) {
				row.price_old = [row.price_old_min, row.price_old_max];
			}

			if (row.img_path && imgProportion && instanceRegistry) {
				const imgAttrs = {
					path: row.img_path,
					width: row.img_width,
					height: row.img_height
				};

				row.thumb = {
					s: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 's', imgProportion),
					m: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 'm', imgProportion),
					l: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'scaled', 'l')
				};

				//					square thumb needs for OpenGraph and schema.org - for tidy search snippets
				row.squareThumb = {
					s: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 's', 'scf'),
					m: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 'm', 'scf'),
					l: thumbnailUrl.getAttrs(instanceRegistry, imgAttrs, 'thumb', 'l', 'scf')
				};
			}

			if (row.manufacturer_image_id && row.manufacturer_img.path) {
				row.manufacturerThumb =
					{s: thumbnailUrl.getAttrs(instanceRegistry, row.manufacturer_img, 'scaled', 's')};
			}

			if (instanceRegistry != null) {
				const router = instanceRegistry.getRouter();

				const params =
					{id: row.url_key ? row.url_key : row.product_id};

				if (row.category_id) {
					//@ts-ignore
					params.category = row.category_id;
				}

				row.url = router.url('@product', params);

				if (row.manufacturer_id) {
					row.manufacturerUrl = router.url('@brand', {
						id: row.manufacturer_url_key ? row.manufacturer_url_key : row.manufacturer_id
					});
				}
			}

			return row;
		}

		static async loadProductForBasket(instanceRegistry, productId, pointId, priceAlias = 'selling_price') {
			const trackInventory = await instanceRegistry.getSettings().get('inventory', 'trackInventory');
			const imgProportion = await instanceRegistry.getSettings().get('system', 'imgProportion');

			const [row] = await this.sequelize.sql(`
				select
					p.product_id,
					i.item_id,
					price.price_id,
					price.price,
					price.price_old,
					pp.available_qty,
					pg.not_track_inventory as product_not_track_inventory,
					count(v.variant_id) as variants
				from
					product p
					inner join inventory_item i on i.product_id = p.product_id
					inner join product_prop pp on p.product_id = pp.product_id
					left join commodity_group pg on pg.group_id = p.group_id
				left join (
					select
						f.item_id,
						f.price_id,
						f.value as price,
						f.old as price_old
					from
						final_price f
						inner join price using(price_id)
					where
						point_id = :point
						and price.alias = :price
				) price on price.item_id = i.item_id
				left join variant v on v.product_id = p.product_id and v.deleted_at is null
				where
					p.product_id = :product
					and p.deleted_at is null
				group by
					p.product_id, i.item_id, price.price_id, price.price, price.price_old, pp.available_qty, product_not_track_inventory
			`, {
				product: productId,
				point: pointId,
				price: priceAlias
			});

			if (row) {
				this.prepareRow(row, trackInventory, imgProportion, instanceRegistry);
			}

			return row;
		}

		static isInStock(trackInventory, row) {
			//@ts-ignore
			row.trackInventory = this.sequelize.model('inventoryItem').shallTrackInventoryByRow(trackInventory, row);

			if (row.trackInventory) {
				return row.inStock = row.available_qty > 0;
			} else {
				return row.inStock = true;
			}
		}

		static createUrlKeyByTitle(title, langAlias, pk = null) {
			const urlKey = speakingUrl(title, {
				lang: langAlias
			});

			return this.findUniqueUrl(urlKey, pk);
		}

		static findUniqueUrl(urlKey, pk = null, suffix = null) {
			let checkingUrl = urlKey;
			if (suffix) {
				checkingUrl += `-${suffix}`;
			} else {
				suffix = 0;
			}

			const where =
				{url_key: checkingUrl};

			if (pk) {
				//@ts-ignore
				where.product_id =
					{[Op.ne]: pk};
			}

			return this.sequelize.model('productText').findOne({
				where
			})
				.then(row => {
					if (row) {
						return this.findUniqueUrl(urlKey, pk, ++suffix);
					} else {
						return checkingUrl;
					}
				}).then(res => res);
		}

		static makeUniqueSku(sku, pk = null, suffix = null) {
			let checkingSku = sku;
			if (suffix) {
				checkingSku += `-${suffix}`;
			} else {
				suffix = 0;
			}

			const where =
				{sku: checkingSku};

			if (pk) {
				//@ts-ignore
				where.product_id =
					{[Op.ne]: pk};
			}

			return this.sequelize.model('product').findOne({
				where
			})
				.then(row => {
					if (row) {
						return this.makeUniqueSku(sku, pk, ++suffix);
					} else {
						return checkingSku;
					}
				}).then(res => res);
		}

		static async sphinxReIndex() {
			return;
		}

		static async safeDelete(options= {where: {}}) {
			const attrs = {};
			//@ts-ignore
			attrs[this.options.deletedAt] = this.sequelize.fn('NOW');

			await this.update(attrs, options);
		}

		static async recover(options = {where: {}}) {
			const attrs = {};
			//@ts-ignore
			attrs[this.options.deletedAt] = null;

			await this.update(attrs, options);
		}

		static async loadCharacteristic(groupId, langId, compiled, select = null) {
			const characteristicIds = Object.keys(compiled);

			if (!characteristicIds.length) {
				return [];
			}

			if (!select) {
				select = this.sequelize.squel().select();
			}

			select
				.field('vw.characteristic_id')
				.field('vw.parent_id')
				.field('vw.title')
				.field('vw.alias')
				.field('vw.type')
				.field('vw.is_folder')
				.from('vw_characteristic_grid', 'vw')
				.where('vw.lang_id = ?', langId)
				.where('vw.group_id = ?', groupId)
				.where(`vw.characteristic_id in (${this.sequelize.escapeIn(characteristicIds)}) or is_folder is true`)
				.order('vw.tree_sort');

			let caseIds = [];
			characteristicIds.forEach(key => {
				if (Array.isArray(compiled[key])) {
					return caseIds = caseIds.concat(compiled[key]);
				}
			});

			if (caseIds.length > 0) {
				select
					.field('cCase.case_id')
					.field('caseText.title', 'case_title')
					.left_join(
						'characteristic_type_case',
						'cCase',
						`cCase.characteristic_id = vw.characteristic_id \
and cCase.case_id in (${this.sequelize.escapeIn(caseIds)})`
					)
					.left_join(
						'characteristic_type_case_text',
						'caseText',
						`cCase.case_id = caseText.case_id \
and caseText.lang_id = ${this.sequelize.escape(langId)}`
					)
					.order('cCase.sort');
			}

			return this.sequelize.execSquel(select)
				.then(rows => {
					let out = [];
					const key2Id = {};

					rows.forEach(row => {
						//@ts-ignore
						const {parent_id, is_folder, characteristic_id, case_id, case_title} = row;
						let outRow;
						let addTo = out;
						if (parent_id && parent_id in key2Id) {
							addTo = out[key2Id[parent_id]].children;
						}

						if (is_folder) {
							outRow = Object.assign(_.pick(row, ['characteristic_id', 'title']), {
								isFolder: true,
								children: []
							});

							out.push(outRow);
							key2Id[characteristic_id] = out.length - 1;

							return;
						} else {
							if (!(characteristic_id in key2Id)) {
								outRow = _.pick(row, ['characteristic_id', 'title', 'alias', 'type']);
								//@ts-ignore
								if (this.sequelize.model('characteristic').isTypeCaseValue(row.type)) {
									//@ts-ignore
									outRow.cases = [];
								} else {
									//@ts-ignore
									outRow.value = Array.isArray(compiled[characteristic_id]) ? null : compiled[characteristic_id];
								}

								addTo.push(outRow);
								key2Id[characteristic_id] = addTo.length - 1;
							}
						}

						if (case_id) {
							const characteristic = addTo[key2Id[characteristic_id]];

							if (characteristic && Array.isArray(characteristic.cases)) {
								return characteristic.cases.push({
									id: case_id,
									value: case_title
								});
							}
						}
					});


					out = this.removeEmptyCharacteristics(out);

					return out;
				});
		}

		static removeEmptyCharacteristics(characteristics) {
			return characteristics.filter(item => {
				if (item.isFolder) {
					item.children = this.removeEmptyCharacteristics(item.children);

					if (item.children.length > 0) {
						return true;
					} else {
						return false;
					}
				} else {
					if ('value' in item) {
						return (item.value !== null) && (item.value !== '');
					}

					if ('cases' in item) {
						return item.cases.length > 0;
					}

					return false;
				}
			});
		}

		//
		static loadCharacteristicValues(productId, groupId, langId) {
			return this.sequelize.sql(`\
select \
vw.characteristic_id, \
vw.parent_id, \
vw.title, \
vw.type, \
vw.system_type, \
vw.is_folder, \
json_agg( \
coalesce( \
characteristic_type_case_text.title, \
characteristic_product_val_text.value \
) \
ORDER BY characteristic_type_case.sort \
) as value \
from \
vw_characteristic_grid vw \
inner join characteristic_product_val using(characteristic_id) \
inner join characteristic_product_val_text on \
characteristic_product_val.value_id = characteristic_product_val_text.value_id \
and characteristic_product_val_text.lang_id = '${this.sequelize.escape(langId)}' \
left join characteristic_type_case using (case_id) \
left join characteristic_type_case_text on \
characteristic_type_case.case_id = characteristic_type_case_text.case_id \
and characteristic_type_case_text.lang_id = '${this.sequelize.escape(langId)}' \
where \
vw.lang_id = :lang \
and vw.group_id = :group \
and product_id = :product \
group by \
vw.characteristic_id, \
vw.parent_id, \
vw.title, \
vw.type, \
vw.system_type, \
vw.is_folder, \
vw.tree_sort \
order by \
vw.tree_sort asc\
`, {
				product: productId,
				group: groupId,
				lang: langId
			});
		}
	}

	Product.init({
		product_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},

		sku: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		manufacturer_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		group_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		has_variants: {
			type: DataTypes.BOOLEAN
		},

		external_id: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		created_by: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'product',
		deletedAt: 'deleted_at',
		modelName: 'product',
		sequelize
	});

	return Product;
}

export interface IProductModel extends ExtendedModel, IProduct {
	readonly productProp?: IProductPropModel;
}

export type IProductModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IProductModel;
}