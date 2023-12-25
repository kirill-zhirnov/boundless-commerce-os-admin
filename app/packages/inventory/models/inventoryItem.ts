import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import serverUtils from '../../../modules/utils/server';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions, Transaction} from 'sequelize';
import {IInventoryItem, IVwInventoryItemRaw} from '../../../@types/inventoryItem';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class InventoryItem extends ExtendedModel {
		static async getVwInventoryItem(itemId, langId): Promise<null|IVwInventoryItemRaw> {
			const [row] = await this.sequelize.sql<IVwInventoryItemRaw>(`
				select
					*
				from
					vw_inventory_item
				where
					item_id = :item
					and (lang_id = :lang or lang_id is null)
			`, {
				item: itemId,
				lang: langId
			});

			return row;
		}

		static async loadItemTitle(itemId, langId) {
			const [row] = await this.sequelize.sql(`
				select
					vw.type,
					vw.product,
					vw.variant,
					vw.custom_item
				from
					vw_inventory_item vw
				where
					vw.item_id = :item
					and (vw.lang_id = :lang or vw.lang_id is null)
			`, {
				item: itemId,
				lang: langId
			});

			if (!row) {
				throw new Error(`Cannot find inventory item: ${itemId}`);
			}

			//@ts-ignore
			const {type, product, variant, custom_item} = row;

			const out = [];
			switch (type) {
				case 'custom_item':
					out.push(custom_item.title);
					break;
				case 'product':
					out.push(product.title);
					break;
				case 'variant':
					out.push(product.title);
					out.push(variant.title);
					break;
			}

			return out;
		}

		static shallTrackInventoryByRow(settingTrackInventory, row) {
			for (const key of ['product_id', 'product_not_track_inventory']) {
				if (_.isUndefined(row[key])) {
					throw new Error(`Key '${key}' not found in Row!`);
				}
			}

			if (settingTrackInventory) {
				let out = true;

				if (row.product_id && (row.product_not_track_inventory != null)) {
					out = !row.product_not_track_inventory;
				} else if ('variant_id' in row && row.variant_id && 'variant_not_track_inventory' in row && (row.variant_not_track_inventory != null)) {
					out = !row.variant_not_track_inventory;
				}

				return out;
			} else {
				return false;
			}
		}

		// stock - Array with: location, item, qty
		// Array[{location:<INT>, item:<INT>, qty:<INT>},...], where:
		// - location - id of inventory_location
		// - item - id of inventory_item
		// - qty - quantity of product.
		//
		// movementId - id of inventory_movement
		// trx - transaction
		static async execSetStock(stock: {location: number, item: number, qty: number}[], movementId: number, trx: Transaction|null) {
			for (const row of stock) {
				await this.sequelize.sql(`select inventory_change_available_qty(
					:movement,
					:location,
					:item,
					:qty
				)`, {
					movement: movementId,
					location: row.location,
					item: row.item,
					qty: row.qty
				}, {transaction: trx});
			}
		}

		// stock - see @execSetStock method.
		static async setStock(stock: {location: number, item: number, qty: number}[], personId: number, reasonCategory: string, reasonAlias: string) {
			const trx = await this.sequelize.transaction({autocommit: false});
			try {
				//@ts-ignore
				const movement = await this.sequelize.model('inventoryMovement').createByReason(reasonCategory, reasonAlias, personId, null, null, null, trx);
				await this.execSetStock(stock, movement.movement_id, trx);
				//@ts-ignore
				await this.sequelize.model('inventoryMovement').destroyIfEmpty(movement.movement_id, trx);
				await trx.commit();
			} catch (e) {
				console.error(e);
				await trx.rollback();

				throw e;
			}
		}

		// prices - Array: [
		// 	{itemId:<INT>, priceId: <INT>, currencyId: <INT>, price: <FLOAT>, oldPrice: <FLOAT>}
		// ]
		static async setPrices(prices: {itemId: number, priceId: number, currencyId: number, price: number|string|null, oldPrice?: number|string|null}[]) {
			// eslint-disable-next-line
			for (let item of prices) {
				_.defaults(item, {
					oldPrice: null
				});

				await this.setPrice(item.itemId, item.priceId, item.currencyId, item.price, item.oldPrice);
			}
		}

		static async setPrice(itemId: number, priceId: number, currencyId: number, price: number|string|null, oldPrice: number|string|null = null) {
			let priceWasSet = false;
			if (price === '' || price === null) {
				await this.sequelize.model('inventoryPrice').destroy({
					where: {
						item_id: itemId,
						price_id: priceId
					}
				});
			} else {
				priceWasSet = true;
				await this.sequelize.sql('select set_inventory_price(:itemId, :priceId, :currencyId, :price, :oldPrice)', {
					itemId,
					priceId,
					currencyId,
					price,
					oldPrice
				});
			}

			if (priceWasSet) {
				//@ts-ignore
				await this.sequelize.model('basketItem').updateItemPrice(itemId, priceId, price);
			}
		}

		static async copyPrices(sourceItemId: number, destItemId: number) {
			const rows = await this.sequelize.model('inventoryPrice').findAll({
				where: {
					item_id: sourceItemId
				}
			});

			for (const row of rows) {
				//@ts-ignore
				await this.setPrice(destItemId, row.price_id, row.currency_id, row.value, row.old);
			}
		}

		static async prepareVwInventoryItems(rows: IVwInventoryItemRaw[], fetchLabels = false, langId = null) {
			const productIds = [];
			for (let i = 0; i < rows.length; i++) {
				rows[i].prices = serverUtils.convertSqlArrAgg2Objects(rows[i].prices);
				productIds.push(rows[i].product_id);
			}

			if (fetchLabels) {
				//@ts-ignore
				const labels = await this.sequelize.model('label').findLabelsByProducts(productIds, langId);
				for (const row of rows) {
					//@ts-ignore
					row.labels = labels[row.product_id] || [];
				}
			}

			return rows;
		}

		static async updateItemsQty(itemIds: number[], qty: number) {
			if (!itemIds.length) return;

			await this.sequelize.sql(`
				update
					inventory_item
				set
					available_qty = :qty
				where
					item_id in (${this.sequelize.escapeIn(itemIds)})
			`, {
				qty
			});
		}

		static async reCalcAvailableQty(trackInventory: boolean, {productId, groupId}: {productId?: number, groupId?: number}) {
			let where, sql;
			const params: {productId?: number, groupId?: number} = {};

			if (groupId) {
				where = 'and (commodity_group ->> \'group_id\')::int = :groupId';
				params.groupId = Number(groupId);
			} else if (productId) {
				where = 'and vw_inventory_item.product_id = :productId';
				params.productId = productId;
			} else {
				throw new Error('productId or groupId must be passed');
			}

			if (trackInventory) {
				sql = `
					update inventory_item
					set
						available_qty = (
							select
								coalesce(sum(available_qty), 0)
							from
								inventory_stock
							where
								inventory_stock.item_id = inventory_item.item_id
						)
					from
						vw_inventory_item
					where
						vw_inventory_item.item_id = inventory_item.item_id
						and vw_inventory_item.lang_id = 1
						${where}
				`;
			} else {
				sql = `
					update inventory_item
					set
						available_qty = (
							case
								when inventory_item.available_qty > 0 then 1
								else 0
							end
						)
					from
						vw_inventory_item
					where
						vw_inventory_item.item_id = inventory_item.item_id
						and vw_inventory_item.lang_id = 1
						${where}
				`;
			}

			await this.sequelize.sql(sql, params);
		}
	}

	InventoryItem.init({
		item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		product_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		variant_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		custom_item_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		available_qty: {
			type: DataTypes.INTEGER
		},

		reserved_qty: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'inventory_item',
		modelName: 'inventoryItem',
		sequelize
	});

	return InventoryItem;
}

export interface IInventoryItemModel extends ExtendedModel, IInventoryItem {
}

export type IInventoryItemModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IInventoryItemModel;

	// updateItemQty(itemId: number, qty: number): void;
	reCalcAvailableQty: (trackInventory: boolean, {productId, groupId}: {productId?: number, groupId?: number}) => Promise<void>;
}