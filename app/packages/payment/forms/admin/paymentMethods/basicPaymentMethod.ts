import BasicForm from '../../../../../modules/form';
import {IPaymentMethodModel, IPaymentMethodModelStatic} from '../../../models/paymentMethod';

export interface IAttrs {
	title: string,
	for_all_delivery: '1' | '0',
	sort: number,
	delivery_id?: null | (number|string)[],
	markUp: number
}

export default class BasicPaymentMethodForm<PaymentAttrs extends IAttrs> extends BasicForm<PaymentAttrs, IPaymentMethodModel> {
	protected gatewayAlias: string|null = null;

	getRules() {
		return [
			['title', 'required'],
			['for_all_delivery', 'safe'],
			['sort', 'isNum'],
			['delivery_id', 'validateDelivery'],
			['markUp', 'isFloat', {max: 99.999}]
		];
	}

	async loadRecord() {
		const row = await (this.getModel('paymentMethod') as IPaymentMethodModelStatic).findException({
			include: [
				{
					model: this.getModel('paymentMethodText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				},
				{
					model: this.getModel('paymentGateway')
				}
			],

			where: {
				payment_method_id: this.pk
			}
		}) as unknown as IPaymentMethodModel;

		return row;
	}

	setupAttrsByRecord() {
		const attrs = {
			title: this.record.paymentMethodTexts[0].title,
			for_all_delivery: this.record.for_all_delivery ? '1' : '0',
			markUp: this.record.mark_up,
			sort: this.record.sort
		};

		if (this.record.paymentGateway) {
			this.gatewayAlias = this.record.paymentGateway.alias;
		}

		this.setAttributes(attrs);
	}

	async save() {
		const attrs = this.getSafeAttrs();

		this.record.set({
			sort: attrs.sort,
			for_all_delivery: attrs.for_all_delivery === '1' ? true : false,
			mark_up: attrs.markUp
		});
		await this.record.save();

		this.record.paymentMethodTexts[0].title = attrs.title;
		await this.record.paymentMethodTexts[0].save();

		await this.saveDeliveryMethods();
	}

	async setup() {
		await super.setup();
		await this.setupDeliveryAttr();
	}

	async getTplData() {
		const data = await super.getTplData();

		Object.assign(data, {
			gatewayAlias: this.gatewayAlias
		});

		return data;
	}

	validateDelivery() {
		if (this.attributes.for_all_delivery === '1') {
			return true;
		}

		if (!Array.isArray(this.attributes.delivery_id) || (this.attributes.delivery_id.length === 0)) {
			this.addError('delivery_id', 'emptyDelivery', this.__('Please choose at least one delivery method.'));
		}

		return true;
	}

	async saveDeliveryMethods() {
		let deliveryId = this.getSafeAttr('delivery_id');
		if (!Array.isArray(deliveryId)) {
			deliveryId = [];
		}

		await this.getDb().sql(`
			delete from
				payment_method_delivery
			where
				payment_method_id = :id
		`, {
			id: this.record.payment_method_id
		});

		for (const id of deliveryId) {
			await this.getDb().sql(`
				insert into payment_method_delivery
					(payment_method_id, delivery_site_id)
				select
					:paymentMethodId,
					delivery_site_id
				from
					delivery_site
				where
					site_id = :site
					and delivery_id = :delivery
			`, {
				paymentMethodId: this.record.payment_method_id,
				site: this.getEditingSite().site_id,
				delivery: id
			});
		}
	}

	async setupDeliveryAttr() {
		if (this.record.for_all_delivery) {
			return;
		}

		const rows = await this.getDb().sql<{delivery_id: number}>(`
			select
				delivery_id
			from
				payment_method_delivery
				inner join delivery_site using(delivery_site_id)
			where
				payment_method_id = :paymentMethod
				and site_id = :site
		`, {
			paymentMethod: this.record.payment_method_id,
			site: this.getEditingSite().site_id
		});

		this.attributes.delivery_id = [];
		for (const {delivery_id} of rows) {
			this.attributes.delivery_id.push(delivery_id);
		}
	}

	rawOptions() {
		return {
			//@ts-ignore
			delivery: this.getModel('delivery').findOptions(this.getEditingLang().lang_id, this.getEditingSite().site_id)
		};
	}
}