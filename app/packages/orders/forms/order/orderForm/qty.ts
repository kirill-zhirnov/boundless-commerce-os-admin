import Form from '../../../../../modules/form';
import validator from 'validator';
import {IVwInventoryItemRaw} from '../../../../../@types/inventoryItem';
import {IOrdersModel} from '../../../models/orders';
import OrderItems, {IQtyUpdate} from '../../../components/orderItems';
import outOfStockHandler from '../../../modules/outOfStockHandler';
import {IInventoryItemModel, IInventoryItemModelStatic} from '../../../../inventory/models/inventoryItem';

interface IQtyValue {
	[key: string]: number;
}
type TShortItemRow = Pick<IVwInventoryItemRaw, 'item_id' | 'track_inventory' | 'available_qty'>;

export default class OrderQtyForm extends Form <{qty: IQtyValue}> {
	protected order?: IOrdersModel;

	getRules() {
		return [
			['qty', 'validateQty'],
			['qty', 'validateStock']
		];
	}

	async save() {
		if (this.order?.isLocked()) {
			return;
		}

		const {qty} = this.getSafeAttrs();

		const upQty: IQtyUpdate[] = [];
		// eslint-disable-next-line prefer-const
		for (let [qtyKey, qtyVal] of Object.entries(qty)) {
			const itemId = parseInt(qtyKey.split('_')[1]);

			upQty.push({
				itemId,
				qty: qtyVal
			});
		}

		try {
			const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.order.order_id);
			await orderItems.bulkSetQty(upQty);
		} catch (e) {
			if (outOfStockHandler.isStockError(e)) {
				const inventoryItem = await (this.getModel('inventoryItem') as IInventoryItemModelStatic).findOne({
					where: {
						item_id: e.itemId
					}
				}) as IInventoryItemModel;

				const formKey = `qty[item_${e.itemId}]`;

				this.addError(
					formKey,
					'notEnoughStock',
					this.__('Cannot make reserve. Item has only %s qty (besides already reserved), you requested %s.', [
						inventoryItem.available_qty,
						e.requestedQty
					])
				);

				throw {};
			} else {
				throw e;
			}
		}
	}

	async validateStock(value: IQtyValue|null|undefined) {
		if (this.hasErrors() || !this.order || !this.order.reserve?.reserve_id || !value) {
			return;
		}

		const orderItems = new OrderItems(this.getInstanceRegistry(), this.getClientRegistry(), this.order.order_id);
		//we need to know - how many Qty already reserved.
		const reservedItems = await orderItems.getItems();

		const itemIds = this.extractItemIdsFromKeys(value);
		const itemsInfo = await this.fetchVwInventoryItems(itemIds);

		// eslint-disable-next-line prefer-const
		for (let [qtyKey, qtyVal] of Object.entries(value)) {
			const formKey = `qty[${qtyKey}]`;
			const itemId = parseInt(qtyKey.split('_')[1]);

			let alreadyReserved = 0;
			const reservedItem = reservedItems.find(({item_id}) => item_id === itemId);
			if (reservedItem) {
				alreadyReserved = reservedItem.qty;
			}

			const needToReserveFromStock = qtyVal - alreadyReserved;

			const itemInfo = itemsInfo.find(({item_id}) => item_id === itemId);
			if (!itemInfo) {
				this.addError(formKey, 'notFound', this.__('Item not found.'));
				continue;
			}

			if (itemInfo.track_inventory && needToReserveFromStock > itemInfo.available_qty) {
				this.addError(
					formKey,
					'notEnoughStock',
					this.__('No such quantity in stock. Already reserved: %s. Available qty: %s.', [alreadyReserved, itemInfo.available_qty])
				);
			}
		}
	}

	async validateQty(value: IQtyValue|null|undefined) {
		if (!value) {
			return;
		}

		const sanitizedQty: IQtyValue = {};
		// eslint-disable-next-line prefer-const
		for (let [qtyKey, qtyVal] of Object.entries(value)) {
			const formKey = `qty[${qtyKey}]`;
			if (!validator.isNumeric(qtyVal, {no_symbols: true})) {
				this.addError(formKey, 'notNumeric', this.__('String should contain only numbers.'));
				continue;
			}

			qtyVal = Number(qtyVal);

			if (qtyVal < 0) {
				this.addError(formKey, 'lessZero', this.__('Quantity cannot be less than 0.'));
				continue;
			}

			sanitizedQty[qtyKey] = qtyVal;

			const itemId = qtyKey.split('_')[1];
			if (!itemId) {
				this.addError(formKey, 'lessZero', 'Incorrect item key');
				continue;
			}
		}

		this.attributes.qty = sanitizedQty;
	}

	async fetchVwInventoryItems(itemId: number[]): Promise<TShortItemRow[]> {
		const rows = await this.db.sql<TShortItemRow>(`
			select
				item_id, track_inventory, available_qty
			from
				vw_inventory_item
			where
				item_id in (${this.db.escapeIn(itemId)})
				and (lang_id = :langId or lang_id is null)
		`, {
			langId: this.getEditingLang().lang_id
		});

		return rows;
	}

	setOrderRecord(record: IOrdersModel) {
		this.order = record;
	}

	extractItemIdsFromKeys(value: IQtyValue): number[] {
		return Object.keys(value)
			.map((qtyKey) => parseInt(qtyKey.split('_')[1]))
			.filter((itemId) => Boolean(itemId))
		;
	}
}