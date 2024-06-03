import BasicInstanceMail from '../../../modules/mail/basicInstanceMail';
import {IOrdersModel, IOrdersModelStatic} from '../models/orders';
import {IPersonModelStatic} from '../../customer/models/person';
import * as mustacheCompiler from '../../system/modules/mustacheCompiler';
import {IPersonProfileModelStatic} from '../../customer/models/personProfile';
import OrderWidgetData from '../components/orderWidgetData';
import FrontEndUrls from '../../../modules/url/frontendUrls';
import {TQueueEventType} from '../../../@types/rabbitMq';
import {INotificationTemplateModel} from '../models/notificationTemplate';

export default class OrdersCustomerMails extends BasicInstanceMail {
	async sendNotificationEmail(orderId: number, eventType: TQueueEventType, statusId: number|null = null) {
		const notifyTemplate = await this.getNotificationTemplate(eventType, statusId);
		if (!notifyTemplate) {
			return;
		}

		const order = await this.findOrderById(orderId);
		if (!order.customer_id) {
			return;
		}

		const customer = await this.getCustomer(order.customer_id);
		const {email} = customer;
		if (!email) {
			return;
		}

		let alias = `orders.notification.${eventType}`;
		if (statusId) {
			alias += `.status-${statusId}`;
		}

		const {subject, html, data} = await this.renderSubjectAndBody(order, notifyTemplate);
		await this.emitMailEvent({
			alias,
			data,
			html,
			subject,
			recipients: [email]
		});
	}

	async renderSubjectAndBody(order: IOrdersModel, {subject, template}: INotificationTemplateModel) {
		const data = await this.getEmailData(order);
		const html = await this.renderLayout(mustacheCompiler.vmCompile(template, data));
		const renderedSubject = mustacheCompiler.vmCompile(subject, data);

		return {
			html,
			subject: renderedSubject,
			data
		};
	}

	protected async findOrderById(orderId: number): Promise<IOrdersModel> {
		const order = await (this.instanceRegistry.getDb().model('orders') as IOrdersModelStatic).findOne({
			where: {
				order_id: orderId
			}
		});

		if (!order) {
			throw new Error(`Cant find order, ID: ${orderId}`);
		}

		return order;
	}

	protected async getCustomer(customerId: number) {
		const customer = await (this.instanceRegistry.getDb().model('person') as IPersonModelStatic).findOne({
			include: [
				{model: (this.instanceRegistry.getDb().model('personProfile')) as IPersonProfileModelStatic}
			],
			where: {
				person_id: customerId
			}
		});

		return customer || null;
	}

	async getNotificationTemplate(eventType: TQueueEventType, statusId: number|null = null): Promise<INotificationTemplateModel | null> {
		const where = {
			event_type: eventType,
			transport: 'email'
		};

		if (eventType === TQueueEventType.updated) {
			Object.assign(where, {
				status_id: statusId
			});
		}

		const template = await this.instanceRegistry.getDb().model('notificationTemplate').findOne({
			where
		}) as INotificationTemplateModel;

		return template;
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
			ORDER_URL: orderUrl || '',
			ORDER_ID: order.order_id,
			ORDER: data.order,
			ORDER_PUBLIC_ID: order.public_id,
			TRACK_NUM: trackNums,
			CUSTOMER_FULLNAME: `${first_name || 'Customer'} ${last_name || ''}`,
			CUSTOMER_FIRSTNAME: first_name || 'Customer',
			CUSTOMER_COMMENT: data.order.orderProp?.client_comment,
			CUSTOMER: data.customer,
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