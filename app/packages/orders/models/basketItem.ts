import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions, Transaction} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class BasketItem extends ExtendedModel {
		static async addItem(
			params: {
				basketId: number,
				itemId: number,
				qty: number,
				priceId?: number|null,
				basicPrice: number,
				finalPrice?: number|null,
				discountAmount?: number|null,
				discountPercent?: number|null
			},
			trx: Transaction|null = null
		) {
			if (!params.finalPrice) {
				params.finalPrice = params.basicPrice;
			}

			_.defaults(params, {
				priceId: null,
				discountAmount: null,
				discountPercent: null
			});

			return this.sequelize.sql(`
				select basket_add_item(:basketId, :itemId, :qty, :priceId, :basicPrice, :finalPrice, :discountAmount, :discountPercent)
			`, params, {
				transaction: trx
			});
		}

		//			Update prices in active baskets (necessary if prices for item was changed).
		static async updateItemPrice(itemId: number, priceId: number, price: number) {
			await this.sequelize.sql(`
				update
					item_price
				set
					basic_price = :price,
					final_price = :price,
					discount_amount = null,
					discount_percent = null
				where
					item_price_id in (
						select
							item_price_id
						from
							basket_item
							inner join basket using(basket_id)
						where
							basket.is_active is true
							and basket_item.item_id = :itemId
							and basket_item.deleted_at is null
					)
					and price_id = :priceId
			`, {
				itemId,
				priceId,
				price
			});
		}
	}

	BasketItem.init({
		basket_item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		basket_id: {
			type: DataTypes.INTEGER
		},

		item_id: {
			type: DataTypes.INTEGER
		},

		qty: {
			type: DataTypes.INTEGER
		},

		item_price_id: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'basket_item',
		deletedAt: 'deleted_at',
		modelName: 'basketItem',
		sequelize
	});

	return BasketItem;
}

export interface IBasketItemModel extends ExtendedModel {
	basket_item_id: number;
	basket_id: number;
	item_id: number;
	qty: number;
	item_price_id: number;
	created_at: string;
	deleted_at: string|null;
}

export type IBasketItemModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): IBasketItemModel;
}