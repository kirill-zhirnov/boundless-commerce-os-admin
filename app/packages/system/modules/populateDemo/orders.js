import Basket from '../../../orders/modules/basket';
import User from '../../../auth/modules/user';
import OrderStatusChanger from '../../../orders/modules/statusChanger';
import * as env from '../../../../modules/env';
import _ from 'underscore';
import subDays from 'date-fns/subDays';

export default class OrdersDemoFiller {
	constructor(instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
		this.db = this.instanceRegistry.getDb();
		this.customers = [];
		this.site = null;
		this.orders = [];
		this.deliveryService = null;

		this.readyEnv = null;
	}

	async populate(amountsOfOrders = 20) {
		this.readyEnv = await env.create(this.instanceRegistry).getEnv();

		await this.loadSite();
		this.deliveryService = await this.db.model('service').findDelivery();

		await this.populateCustomers();

		for (let i = 0, end = amountsOfOrders, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
			await this.createOrder();
		}

		const length = this.orders.length - 1;

		const canceledOrders = Math.floor(length * 0.3);
		const readyToShip = Math.floor(length * 0.2);
		const sent = Math.floor(length * 0.2);

		await this.changeStatusForGroup(canceledOrders, 'cancelled');
		await this.changeStatusForGroup(readyToShip, 'ready_to_ship');
		await this.changeStatusForGroup(sent, 'sent');
	}

	async changeStatusForGroup(orderAmounts, toStatusAlias) {
		if (!this.orders.length) {
			return;
		}

		const rows = await this.db.sql(`
			select
				orders.*,
				reserve.reserve_id
			from
				orders
			inner join order_status using(status_id)
			inner join reserve using(order_id)
			where
				order_id in (:orders)
				and order_status.alias = 'new'
			order by random()
			limit ${orderAmounts}
		`, {
			orders: _.pluck(this.orders, 'order_id')
		});

		for (const row of Array.from(rows)) {
			const statusChanger = new OrderStatusChanger(this.readyEnv, row.order_id);
			statusChanger.setPersonId(row.customer_id);

			await statusChanger.changeOrderStatus(toStatusAlias);
		}
	}

	async loadSite() {
		this.site = await this.db.model('site').findOne();
	}

	async createOrder() {
		const customer = this.customers[_.random(0, (this.customers.length - 1))];
		const user = this.createUserByPersonId(customer.person_id);

		const basket = new Basket(this.instanceRegistry, user);

		try {
			const price = await this.findPrice();
			const usedItems = [];

			const itemsInOrder = _.random(1, 2);
			for (let i = 0; i < itemsInOrder; i++) {
				const item = await this.findRandomInventoryItem(price, usedItems);
				if (!item) throw new Error('itemNotFound');

				const qty = _.random(1, item.available_qty);
				usedItems.push(item.item_id);

				await basket.addItem(item.item_id, qty, price.price_id, item.price);
			}

			const source = await this.findRandomOrderSource();
			const paymentMethod = await this.findRandomPaymentMethod();
			const basketRow = await basket.getBasket();

			const order = await this.db.model('orders').create({
				source_id: source.source_id,
				point_id: this.site.point_id,
				customer_id: customer.person_id,
				basket_id: basketRow.basket_id,
				payment_method_id: paymentMethod.payment_method_id,
				created_by: customer.person_id,
				created_at: this.getRandomDate().toISOString()
			});

			const statusChanger = new OrderStatusChanger(this.readyEnv, order.order_id);
			statusChanger.setPersonId(customer.person_id);
			await statusChanger.orderCreated();

			await this.addOrderShipping(order);
			await this.db.model('orders').calcOrderTotalById(this.instanceRegistry, order.order_id);

			this.orders.push(order);
		} catch (e) {
			if (e === 'itemNotFound') {
				return;
			} else {
				throw e;
			}
		}
	}

	async addOrderShipping(order) {
		const delivery = await this.findRandomDelivery();

		if (!delivery)
			return;

		const itemPrice = await this.db.model('itemPrice').create({
			final_price: _.random(100, 300)
		});
		const orderService = await this.db.model('orderService').create({
			order_id: order.order_id,
			service_id: this.deliveryService.service_id,
			qty: 1,
			item_price_id: itemPrice.item_price_id,
			is_delivery: true
		});

		await this.db.model('orderServiceDelivery').update({
			delivery_id: delivery.delivery_id
		}, {
			where: {
				order_service_id: orderService.order_service_id
			}
		});
	}

	async findRandomDelivery() {
		const [row] = await this.db.sql(`
			select
				delivery.*
			from
				delivery
				inner join shipping using(shipping_id)
			where
				delivery.deleted_at is null
				and shipping.alias in ('rusSnailMail', 'boxBerry')
			order by random()
			limit 1
		`);

		return row;
	}

	findPrice() {
		return this.db.model('price').findOne({
			where: {
				alias: 'selling_price'
			}
		});
	}

	getRandomDate() {
		const maxTs = Date.now();
		const minTs = subDays(maxTs, 25).getTime();

		return new Date(_.random(minTs, maxTs));
	}

	findRandomPaymentMethod() {
		return this.db.model('paymentMethod').findOne({
			where: {
				for_all_delivery: true
			},

			order: [
				this.db.fn('random')
			]
		});
	}

	findNewOrderStatus(alias = 'new') {
		return this.db.model('orderStatus').findOne({
			where: {
				alias
			}
		});
	}

	findRandomOrderSource() {
		return this.db.model('orderSource').findOne({
			where: {
				deleted_at: null
			},
			order: [
				this.db.fn('random')
			]
		});
	}


	async findRandomInventoryItem(price, usedItems = []) {
		const condition = usedItems.length > 0
			? 'and inventory_item.item_id not in (:usedItems)'
			: '';

		const [row] = await this.db.sql(`
			select
				inventory_item.*,
				inventory_price.value as price
			from
				inventory_item
			inner join inventory_price using(item_id)
			where
				available_qty > 0
				and price_id = :price
				and inventory_price.value is not null
				and inventory_price.value > 0
				${condition}
			order by random()
			limit 1
		`, {
			price: price.price_id,
			usedItems
		});

		if (row) {
			return {
				item_id: row.item_id,
				available_qty: row.available_qty,
				price: row.price
			};
		}

		return null;
	}

	async populateCustomers() {
		for (const mock of Array.from(this.getCustomersMock())) {
			const customer = await this.db.model('person').create({
				site_id: this.site.site_id,
				registered_at: this.db.fn('now'),
				email: mock.email
			});

			const attrs = _.pick(mock, ['first_name', 'last_name', 'phone']);
			await this.db.model('personProfile').update(attrs, {
				where: {
					person_id: customer.person_id
				}
			});

			await this.db.model('personAddress').create({
				person_id: customer.person_id,
				type: 'shipping',
				is_default: true,
				first_name: attrs.first_name,
				last_name: attrs.last_name,
				phone: mock.phone,
				zip: mock.zip,
				city: mock.city,
				state: mock.state,
				address_line_1: mock.address_line_1,
				country_id: mock.country_id
			});

			await this.db.model('role').setClientRoles(customer.person_id);

			this.customers.push(customer);
		}
	}

	createUserByPersonId(personId) {
		const request = {
			session: {
				user: {
					id: personId
				}
			}
		};

		return new User(request, {});
	}



	getCustomersMock() {
		return [
			{
				first_name: 'Leilani',
				last_name: 'Boyer',
				phone: '+15708737090',
				email: 'leilani@no-reply.boundless-commerce.com',
				address_line_1: '557-6308 Lacinia Road',
				city: 'San Bernardino',
				state: 'North Dakota',
				zip: '09289',
				country_id: 236
			},
			{
				first_name: 'Bryar',
				last_name: 'Pitts',
				phone: '+17174504729',
				email: 'bryar@no-reply.boundless-commerce.com',
				address_line_1: '5543 Aliquet St.',
				city: 'Fort Dodge',
				state: 'Georgia',
				zip: '20783',
				country_id: 236
			},
			{
				first_name: 'Adria',
				last_name: 'Russell',
				phone: '+15167454496',
				email: 'adria@no-reply.boundless-commerce.com',
				address_line_1: '778-9383 Suspendisse Av.',
				city: 'Weirton',
				state: 'Indiana',
				zip: '19759',
				country_id: 236
			},
			{
				first_name: 'Rebecca',
				last_name: 'Chambers',
				phone: '+14554300989',
				email: 'rebecca@no-reply.boundless-commerce.com',
				address_line_1: 'P.O. Box 813 5982 Sit Ave',
				city: 'Liberal',
				state: 'Vermont',
				zip: '51324',
				country_id: 236
			},
			{
				first_name: 'Edward',
				last_name: 'Nieves',
				phone: '+18026688240',
				email: 'edward@no-reply.boundless-commerce.com',
				address_line_1: '928-3313 Vel Av.',
				city: 'Idaho Falls',
				state: 'Rhode Island',
				zip: '37232',
				country_id: 236
			},
		];
	}
}
