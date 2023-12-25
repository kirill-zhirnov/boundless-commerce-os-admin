import Component from '../../../modules/component';
import Reserve from './reserve';
import Reserve2Basket from './reserve2Basket';
// import Notifier from './statusChanger/notifier';

export default class OrderStatusChanger extends Component {
	constructor(env, orderId) {
		super(env);

		this.orderId = orderId;

		this.toStatusId = null;
		this.fromStatusId = null;
		this.trx = null;
		this.order = null;
		this.reserveId = null;

		this.personId = (this.getUser()) ? this.getUser().getId() : null;

		// this.isOrderCreation = false;
	}

	async orderCreated(toStatusId = null) {
		if (toStatusId === null) {
			toStatusId = await this.getSetting('orders', 'new_order_status_id');
		}
	//
	// 	this.isOrderCreation = true;
		await this.changeOrderStatus(toStatusId);
	}

	/**
	 *
	 * @param toStatusId int - также можно передать альяс статуса, вместо ID
	 */
	async changeOrderStatus(toStatusId) {
		this.toStatusId = toStatusId;

		await this.initToStatus();

		await this.setupOrder();
		await this.saveOrderStatus();
		await this.saveStockLocation();
		// await this.saveStatusHistory();
	}

	async runChangeStatusInTrx(toStatusId) {
		this.trx = await this.getDb().transaction({autocommit: false});

		try {
			await this.changeOrderStatus(toStatusId);
			await this.trx.commit();
		} catch (e) {
			await this.trx.rollback();

			throw e;
		}
	}

	async saveStockLocation() {
		let stockLocationOptions = await this.getModel('orderStatus').findStockLocationOptions(),
			//если позиция остатков неизвестна - считаем, что остатки находятся в корзине
			fromPosition = this.fromStatusId ? stockLocationOptions[this.fromStatusId] : 'basket',
			toPosition = stockLocationOptions[this.toStatusId],
			logOrderStatusChanged = null
		;

		if (fromPosition == toPosition) {
			if (fromPosition == 'basket') {
				await this.makeBasketInActive();
			}

			return null;
		}

		if (this.fromStatusId) {
			logOrderStatusChanged = {
				from: this.fromStatusId,
				to: this.toStatusId
			};
		}

		//если позиция в корзине - значит противоположность - это резерв (либо inside либо outside)
		if (fromPosition == 'basket') {
			let reserve = new Reserve(this.instanceRegistry);
			reserve.setTrx(this.trx);

			let reserveCompleted = (toPosition == 'outside') ? true : false;
			await reserve.createReserveByBasket(
				this.order.order_id,
				this.order.basket_id,
				this.personId,
				reserveCompleted,
				logOrderStatusChanged
			);
		} else {
			//fromPosition либо inside либо outside - товар находится в резерве
			if (toPosition == 'basket') {
				let reserve2basket = new Reserve2Basket(this.getEnv(), this.orderId);
				reserve2basket.setTrx(this.trx);

				if (logOrderStatusChanged) {
					reserve2basket.setMovementProps({
						orderStatusFrom: logOrderStatusChanged.from,
						orderStatusTo: logOrderStatusChanged.to
					});
				}

				await reserve2basket.process();
			} else {
				let reserve = new Reserve(this.instanceRegistry);
				reserve.setTrx(this.trx);

				if (!this.reserveId)
					throw new Error(`OrderStatusChanger reserveId is null - cant saveStockLocation for orderId: ${this.orderId}, from: ${this.fromStatusId}, to: ${this.toStatusId}`);

				switch (toPosition) {
					case 'inside':
						await reserve.setReserveUncompleted(this.reserveId, this.personId, logOrderStatusChanged);
						break;
					case 'outside':
						await reserve.setReserveCompleted(this.reserveId, this.personId, logOrderStatusChanged);
						break;
				}
			}
		}

		return true;
	}

	// async saveStatusHistory() {
	// 	await this.getModel('orderHistory').create({
	// 		order_id: this.orderId,
	// 		status_id: this.toStatusId,
	// 		person_id: this.personId
	// 	}, {
	// 		transaction: this.trx
	// 	});
	// }

	async makeBasketInActive() {
		if (this.order.basket && this.order.basket.is_active) {
			await this.order.basket
				.set({is_active: false})
				.save({transaction: this.trx})
			;
		}
	}

	async saveOrderStatus() {
		if (this.fromStatusId != this.toStatusId) {
			await this.getModel('orders').update({
				status_id: this.toStatusId
			}, {
				where: {
					order_id: this.orderId
				},
				transaction: this.trx
			});
		}
	}

	async setupOrder() {
		this.order = await this.getModel('orders').findOne({
			where: {
				order_id: this.orderId
			},
			include: [
				{
					model: this.getModel('reserve'),
				},
				{
					model: this.getModel('basket')
				}
			],
			transaction: this.trx
		});

		if (!this.order) {
			throw new Error(`OrderStatusChanger cant find order with ID:${this.orderId}.`);
		}

		this.fromStatusId = this.order.status_id;

		if (this.order.reserve) {
			this.reserveId = this.order.reserve.reserve_id;
		}
	}

	async initToStatus() {
		if (/^\d+$/.test(String(this.toStatusId)))
			return;

		let row = await this.getModel('orderStatus').findException({
			where: {
				alias: this.toStatusId
			}
		});

		this.toStatusId = row.status_id;
	}

	// async notify(notifyAdmins = true) {
	// 	let notifier = new Notifier(this.getEnv(), this.orderId);
	//
	// 	if (this.isOrderCreation) {
	// 		await notifier.orderCreated(this.toStatusId, notifyAdmins);
	// 	} else {
	// 		await notifier.statusChanged(this.toStatusId);
	// 	}
	// }

	setTrx(trx) {
		this.trx = trx;

		return this;
	}

	setPersonId(personId) {
		this.personId = personId;

		return this;
	}
}