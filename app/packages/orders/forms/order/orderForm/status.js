import Form from '../../../../../modules/form';
import {IOrdersModel} from '../../../models/orders';
import outOfStockHandler from '../../../modules/outOfStockHandler';
import StatusChanger from '../../../modules/statusChanger';
import {Transaction} from 'sequelize';

export default class OrderStatus extends Form {
	constructor(options) {
		super(options);

		/**
		 * @type {null|IOrdersModel}
		 */
		this.record = null;

		/**
		 * @type {{status_id?: number, is_paid?: string|null}}
		 */
		this.attributes = {};
	}

	getRules() {
		return [
			['status_id', 'required'],
			['status_id', 'inOptions', {options : 'status'}],
			['is_paid', 'safe']
		];
	}

	rawOptions() {
		return {
			//@ts-ignore
			status: this.getModel('orderStatus').findTreeOptions(this.getEditingLang().lang_id)
		};
	}

	async setOrderRecord(record) {
		this.record = record;

		this.scenario = 'update';
		await this.setupAttrsByRecord();
	}

	async setupAttrsByRecord() {
		super.setupAttrsByRecord();

		this.attributes.is_paid = (this.record.paid_at) ? '1' : null;

		//@ts-ignore
		if (!this.attributes.status_id) {
			this.attributes.status_id = await this.getSetting('orders', 'new_order_status_id');
		}
	}

	async save() {
		/**
		 * @type {{status_id?: number, is_paid?: string|null}}
		 */
		//@ts-ignore
		const attrs = this.getSafeAttrs();

		const transaction = await this.db.transaction({autocommit: false});
		try {
			await this.saveOrderProps(transaction);

			const statusChanger = new StatusChanger(await this.getEnv(), this.record.order_id);
			statusChanger.setTrx(transaction);
			await statusChanger.changeOrderStatus(attrs.status_id);

			await transaction.commit();
		} catch (e) {
			await transaction.rollback();

			if (outOfStockHandler.isStockError(e)) {
				//@ts-ignore
				const inventoryItem = await this.getModel('inventoryItem').getVwInventoryItem(e.itemId, this.getEditingLang().lang_id);

				const title = [];
				switch (inventoryItem.type) {
					case 'custom_item':
						title.push(inventoryItem.custom_item.title);
						break;
					case 'product':
						title.push(inventoryItem.product.title);
						break;
					case 'variant':
						title.push(inventoryItem.product.title);
						title.push(inventoryItem.variant.title);
						break;
				}

				this.addError(
					'status_id',
					'notEnoughStock',
					this.__('Cannot make reserve. Item "%s" has only %s qty, you requested %s', [
						title.join(','),
						inventoryItem.available_qty,
						e.requestedQty
					])
				);

				throw {};
			} else {
				throw e;
			}
		}

		// await this.record.save();
	}

	/**
	 * @param {Transaction} transaction
	 * @returns {Promise<void>}
	 */
	async saveOrderProps(transaction) {
		/**
		 * @type {{status_id?: number, is_paid?: string|null}}
		 */
			//@ts-ignore
		const attrs = this.getSafeAttrs();

		if (this.record.publishing_status === 'draft') {
			const {basket_id} = await this.getClientRegistry().getBasket().getBasket();
			this.record.set({
				basket_id,
				point_id: this.getEditingSite().point_id,
				//@ts-ignore
				publishing_status: 'published'
			});
		}

		if (attrs.is_paid == '1') {
			if (!this.record.paid_at) {
				//@ts-ignore
				this.record.paid_at = this.db.fn('now');
			}
		} else {
			if (this.record.paid_at) {
				this.record.paid_at = null;
			}
		}

		await this.record.save({transaction});
	}
}