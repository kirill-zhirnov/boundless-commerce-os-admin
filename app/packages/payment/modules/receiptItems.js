const Component = require('../../../modules/component');
const moolah = require('moolah');

class ReceiptItems extends Component {
	constructor(env, order) {
		super(env);

		this.order = order;

		this.receiptItems = null;
		this.needReduce = 0;
	}

	getReceiptItems() {
		if (this.receiptItems === null) {
			this.process();
		}

		return this.receiptItems;
	}

	process() {
		this.receiptItems = [];
		if (this.order.order.discount_for_order)
			this.needReduce = Number(this.order.order.discount_for_order);

		let needReduce = Math.min(
			Number(this.order.items.total.price), this.needReduce
		);
		this.needReduce = moolah(this.needReduce).less(needReduce).float()
		this.processItems(needReduce);

		needReduce = Math.min(
			Number(this.order.services.total.price), this.needReduce
		);
		this.processServices(needReduce);

		if (this.order.order.payment_mark_up) {
			let price = moolah(this.order.order.payment_mark_up).string();

			this.receiptItems.push({
				title: this.__('Markup for payment method'),
				qty: 1,
				price: price,
				sum: price,
				type: 'paymentMarkUp',
				vat: 'noVat'
			});
		}

		this.checkYourSelf();
	}

	processServices(discount) {
		let share = this.calcShare(this.order.services.total.price, discount),
			reducedBy = 0
		;

		this.order.services.items.forEach((item, i) => {
			if (!Number(item.total_price))
				return;

			let receiptRow = this.calcReceiptRow(share, item.final_price, item.qty, item.total_price);
			reducedBy = moolah(reducedBy).plus(receiptRow.diff).float();

			let row = {
				service_id: item.service_id,
				title: item.title,
				price: receiptRow.price,
				sum: receiptRow.sum,
				qty: item.qty,
				type: 'service',
				isDelivery: item.is_delivery,
				vat: 'noVat'
			};

			if (item.is_delivery) {
				// row.delivery_tax = item.delivery_tax;
				row.vat = item.delivery_tax;
			}

			this.receiptItems.push(row);
		});

		this.compareReducedByAndDiscount(discount, reducedBy);
	}

	processItems(discount) {
		let share = this.calcShare(this.order.items.total.price, discount),
			reducedBy = 0
		;

		this.order.items.items.forEach((item, i) => {
			let receiptRow = this.calcReceiptRow(share, item.final_price, item.qty, item.total);
			reducedBy = moolah(reducedBy).plus(receiptRow.diff).float();

			this.receiptItems.push({
				item_id: item.item_id,
				title: item.title,
				price: receiptRow.price,
				sum: receiptRow.sum,
				qty: item.qty,
				type: 'product',
				vat: item.vat
			});
		});

		this.compareReducedByAndDiscount(discount, reducedBy);
	}

	compareReducedByAndDiscount(discount, reducedBy) {
		if (reducedBy > discount) {
			let diff = moolah(reducedBy).less(discount).string();

			this.receiptItems.push({
				title: this.__('Adjustment for discount in receipt'),
				price: diff,
				sum: diff,
				qty: 1,
				type: 'adjustment',
				vat: 'noVat'
			});
		}
	}

	calcReceiptRow(share, finalPrice, qty, total) {
		let price = moolah(finalPrice).times(share).string(),
			sum = moolah(qty).times(price).string(),
			diff = moolah(total).less(sum).float()
		;

		return {
			price,
			sum,
			diff
		};
	}

	calcShare(totalItems, discount) {
		totalItems *= 1;

		return Math.floor((totalItems - discount) / totalItems * 100) / 100;
	}

	checkYourSelf() {
		let total = moolah(0);
		this.receiptItems.forEach((row) => {
			total.plus(row.sum);
		});

		if (Number(this.order.order.total_price) != total.float()) {
			console.error(
				`Wrong receipt for order! InstanceId: ${this.getInstanceRegistry().getInstanceInfo().instance_id}, OrderId: ${this.order.order.order_id}`,
				this.receiptItems,
				this.order
			);
		}
	}
}

module.exports = ReceiptItems;