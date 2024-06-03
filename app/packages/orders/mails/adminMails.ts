import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';
import {IOrdersModel, IOrdersModelStatic} from '../models/orders';
import {IPersonModelStatic} from '../../customer/models/person';
import {TRoleAlias} from '../../../@types/person';
import OrderWidgetData from '../components/orderWidgetData';
import FrontEndUrls from '../../../modules/url/frontendUrls';

export default class OrderAdminMails extends BasicInstanceMail {
	async sendNewOrderNotification(orderId: number) {
		const order = await this.findOrder(orderId);
		const alias = 'orders.newOrderAdmin';
		const data = await this.getEmailData(order);

		const {html, subject} = await this.renderDbTemplate({
			alias, data
		});

		const adminEmails = (await (this.instanceRegistry.getDb().model('person') as IPersonModelStatic).findActiveByRole([
			TRoleAlias.Admin, TRoleAlias.OrdersManager
		])).map(({email}) => email);

		await this.emitMailEvent({
			alias,
			data,
			html,
			subject,
			recipients: adminEmails
		});
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

	async getEmailData(order: IOrdersModel) {
		const clientRegistry = (await this.getFrontController()).getClientRegistry();
		const orderData = new OrderWidgetData(this.getInstanceRegistry(), clientRegistry, order.order_id);
		const data = await orderData.getOrderData();

		const {first_name, last_name} = data.customer?.personProfile || {};
		const trackNums = (data.trackNumbers || []).map(el => el.track_number).join(', ');

		const frontendUrls = new FrontEndUrls(this.getInstanceRegistry());
		const orderUrl = await frontendUrls.getOrderUrlByOrderId(order.public_id);
		const siteUrl = await frontendUrls.getSiteUrl();

		return {
			ADMIN_ORDER_URL: this.getInstanceRegistry().getRouter()
				.url('orders/admin/orders/form', {pk: order.order_id}, true),
			ORDER_URL: orderUrl || '',
			ORDER_ID: order.order_id,
			ORDER: data.order,
			ORDER_PUBLIC_ID: order.public_id,
			TRACK_NUM: trackNums,
			CUSTOMER_FULLNAME: `${first_name || 'Customer'} ${last_name || ''}`,
			CUSTOMER_COMMENT: data.order.orderProp?.client_comment,
			CUSTOMER: data.customer,
			CUSTOMER_FORM_URL: this.getInstanceRegistry().getRouter()
				.url('customer/admin/customer/form', {pk: data.customer.person_id}, true),
			ITEMS: data.items,
			SITE_URL: siteUrl || '',
			SUMMARY: data.summary,
			DISCOUNTS: data.discounts,
			SHIPPING: data.shipping,
			SHIPPING_ADDRESS: data.shippingAddressTpl,
			BILLING_ADDRESS: data.billingAddressTpl,
			PAYMENT_METHOD: data.paymentMethod,
			TAX_SETTINGS: data.taxSettings
		};
	}
}