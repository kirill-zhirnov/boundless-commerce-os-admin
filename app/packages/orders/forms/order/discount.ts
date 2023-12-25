import Form, {IFormOptions, ITplData} from '../../../../modules/form';
import {IOrderDiscountModelStatic} from '../../models/orderDiscount';
import {TDiscountType, TOrderDiscountSource} from '../../../../@types/orders';
import {Op} from 'sequelize';
import {IOrdersModelStatic} from '../../models/orders';
import {ICouponCodeModelStatic} from '../../models/couponCode';
import {diff} from 'deep-object-diff';
import * as orderEvents from '../../components/orderEventNotification';

interface IAttrs {
	value: number|null,
	discount_type: TDiscountType|null,
	title: string|null
}

export default class OrderDiscountForm extends Form<IAttrs> {
	protected orderId: number;
	protected discountsBeforeSave: {[key: string]: any}|null = null;

	constructor(options: IFormOptions & {orderId: number}) {
		super(options);

		this.orderId = options.orderId;
	}

	getRules() {
		return [
			['value, discount_type', 'required'],
			['value', 'toNumber'],
			['discount_type', 'inOptions', {options: 'discount_type'}],
			['title', 'toString'],
			['value', 'validateManualIsSingle'],
			['value', 'validateDiscountValue']
		];
	}

	async loadRecord() {
		this.discountsBeforeSave = await this.loadAllDiscounts();

		return (this.getModel('orderDiscount') as IOrderDiscountModelStatic).findException({
			where: {
				discount_id: this.pk,
				order_id: this.orderId,
				source: TOrderDiscountSource.manual
			}
		});
	}

	async save() {
		if (!this.record) {
			this.record = await (this.getModel('orderDiscount') as IOrderDiscountModelStatic).build({
				order_id: this.orderId
			}).save();
		}

		const attrs = this.getSafeAttrs();

		//@ts-ignore
		this.record.set({
			title: attrs.title ? String(attrs.title).substr(0, 254) : null,
			discount_type: attrs.discount_type,
			value: attrs.value,
			source: TOrderDiscountSource.manual
		});
		//@ts-ignore
		await this.record.save();

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			this.orderId,
			{discounts: diff(this.discountsBeforeSave, await this.loadAllDiscounts())}
		);

		await (this.getModel('orders') as IOrdersModelStatic).calcOrderTotalById(this.getInstanceRegistry(), this.orderId);
	}

	async loadAllDiscounts() {
		const rows = await (this.getModel('orderDiscount') as IOrderDiscountModelStatic).findAll({
			include: [
				{model: this.getModel('couponCode') as ICouponCodeModelStatic}
			],
			where: {
				order_id: this.orderId
			},
			order: [['created_at', 'asc']]
		});

		return rows.map(el => el.toJSON());
	}

	async getTplData() {
		const data: ITplData<IAttrs> & {orderId?: number} = await super.getTplData();
		data.orderId = this.orderId;

		return data;
	}

	//eslint-disable-next-line
	validateDiscountValue(value) {
		if (this.hasErrors('value') || this.hasErrors('discount_type')) {
			return;
		}

		// if (this.attributes.discount_type == TDiscountType.percent) {
		// 	if (value > 100) {
		//
		// 	}
		// }
	}

	async validateManualIsSingle() {
		const where = {
			order_id: this.orderId,
			source: TOrderDiscountSource.manual
		};

		if (this.pk) {
			Object.assign(where, {
				discount_id: {
					[Op.ne]: this.pk
				}
			});
		}

		const total = await this.getModel('orderDiscount').count({
			where
		});

		if (total > 0) {
			this.addError('value', 'alreadyExists', this.__('Another discount has already been added to the order.'));
			return;
		}
	}

	rawOptions() {
		return {
			discount_type: [
				[TDiscountType.percent, this.__('Percent')],
				[TDiscountType.fixed, this.__('Amount')]
			]
		};
	}
}