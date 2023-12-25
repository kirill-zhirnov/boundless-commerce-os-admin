import Form, {IFormOptions} from '../../../../modules/form/index';
import StatusChanger from '../../modules/statusChanger';
import outOfStockHandler from '../../modules/outOfStockHandler';
import {Op} from 'sequelize';
import {IOrdersModel, IOrdersModelStatic} from '../../models/orders';
import {IOrderStatusModelStatic} from '../../models/orderStatus';

export interface IAttrs {
	status_id: number;
}

export default class StatusChange extends Form<IAttrs> {
	protected ordersIdList: number[];

	constructor(options: IFormOptions & { orders: number[]}) {
		super(options);

		this.ordersIdList = options.orders;
	}

	getRules() {
		return [
			['status_id', 'required'],
			['status_id', 'inOptions', {options: 'status'}]
		];
	}

	async getTplData() {
		const data = await super.getTplData();

		Object.assign(data.attrs, {
			orders: this.ordersIdList
		});

		return data;
	}

	async save() {
		const {status_id} = this.getSafeAttrs();
		const readyEnv = await this.getEnv();
		const orders = await this.getOrdersToChangeStatus(this.ordersIdList, status_id);

		const pkList = [];
		for (const order of orders) {
			try {
				const statusChanger = new StatusChanger(readyEnv, order.order_id);
				await statusChanger.runChangeStatusInTrx(status_id);

				pkList.push(order.order_id);
			} catch (e) {
				if (outOfStockHandler.isStockError(e)) {
					await outOfStockHandler.process(e, this.getController(), this.getEditingLang());
				} else {
					throw e;
				}
			}
		}

		await this.getInstanceRegistry().getEventPublisher().modelChanged({
			model: 'orders',
			pkList,
			diff: {
				status_id: Number(status_id)
			},
			userId: this.getUser().getId()
		});
	}

	rawOptions() {
		return {
			status: (this.getModel('orderStatus') as IOrderStatusModelStatic).findTreeOptions(this.getEditingLang().lang_id)
		};
	}

	async getOrdersToChangeStatus(orders: number[], statusId: number): Promise<IOrdersModel[]> {
		return (this.getModel('orders') as IOrdersModelStatic).findAll({
			where: {
				order_id: orders,
				status_id: {
					[Op.ne]: statusId
				}
			}
		});
	}
}