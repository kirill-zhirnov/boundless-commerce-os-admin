import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';
import {IOrdersModel, IOrdersModelStatic} from '../models/orders';
import {IPersonModelStatic} from '../../customer/models/person';
import {TRoleAlias} from '../../../@types/person';
import OrderWidgetData from '../components/orderWidgetData';

export default class OrderAdminMails extends BasicInstanceMail {
	async sendNewOrderNotification(orderId: number) {
		const clientRegistry = (await this.getFrontController()).getClientRegistry();

		const orderData = new OrderWidgetData(this.getInstanceRegistry(), clientRegistry, orderId);
		const data = await orderData.getOrderData();

		const adminEmails = (await (this.instanceRegistry.getDb().model('person') as IPersonModelStatic).findActiveByRole([
			TRoleAlias.Admin, TRoleAlias.OrdersManager
		])).map(({email}) => email);

		const html = await this.renderNewOrderContent(data);
		const mail = await this.getMail();
		mail.addTo(adminEmails);
		mail.setSubject(`New order #${data.order.order_id}`);
		mail.setBodyHtml(html.full);
		mail.setBodyText(this.createTextVersion(html.content));
		await mail.send();
	}

	async renderNewOrderContent(data) {
		return this.render('newOrder', {data});
	}

	protected async findOrder(orderId: number): Promise<IOrdersModel> {
		const order = await (this.instanceRegistry.getDb().model('orders') as IOrdersModelStatic).findOne({
			where: {
				order_id: orderId
			}
		}) as IOrdersModel;

		if (!order) {
			throw new Error(`Cant find order by ID: ${orderId}.`);
		}

		return order;
	}

	getFileName(): string {
		return __filename;
	}
}