import Component from '../../../modules/component';
import StatusChanger from './statusChanger';

export default class OrderRemover extends Component {
	constructor(env, orderId) {
		super(env);

		this.orderId = orderId;
	}

	async remove() {
		let order = await this.findOrder();

		if (!order) {
			return false;
		}

		//если у заказа есть активный резерв (резерв создан, но не завершен) - заказ сперва отменяем
		//а позиции возвращаем на склад.
		//@ts-ignore
		if (order.stock_location == 'inside') {
			let statusChanger = new StatusChanger(this.getEnv(), this.orderId);
			await statusChanger.runChangeStatusInTrx('cancelled');
		}

		await this.getDb().sql('delete from orders where order_id = :order', {
			order: this.orderId
		});
	}

	async findOrder() {
		const [row] = await this.getDb().sql(`
			select
				order_id,
				status_id,
				stock_location
			from
				orders
				left join order_status using(status_id)
			where
				order_id = :order
		`, {
			order: this.orderId
		});

		return row;
	}
}