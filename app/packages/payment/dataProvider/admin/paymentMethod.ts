import DataProvider from '../../../../modules/dataProvider/index';
import {IPaymentGatewayModelStatic} from '../../models/paymentGateway';

interface IPaymentMethodSettingRow {
	payment_method_id: number;
	sort: number;
	title: string;
	alias: string | null;
	description: string | null;
	deleted_at: string | null;
}

export default class PaymentMethodSettingsDataProvider extends DataProvider<IPaymentMethodSettingRow> {
	createQuery() {
		this.q.field('payment_method.payment_method_id');
		this.q.field('payment_method.sort');
		this.q.field('mText.title');
		this.q.field('payment_gateway.alias');
		this.q.field('payment_gateway_text.description');
		this.q.field('payment_method.deleted_at');

		this.q.from('payment_method');
		this.q.join('payment_method_text', 'mText', 'payment_method.payment_method_id = mText.payment_method_id');
		this.q.left_join('payment_gateway', null, 'payment_method.payment_gateway_id = payment_gateway.payment_gateway_id');
		this.q.left_join('payment_gateway_text', null, 'payment_gateway.payment_gateway_id = payment_gateway_text.payment_gateway_id and mText.lang_id = payment_gateway_text.lang_id');

		this.q.where('mText.lang_id = ?', this.getEditingLang().lang_id);
		return this.compareRmStatus('payment_method.deleted_at');
	}

	prepareData(rows) {
		const PaymentGateway = this.getModel('paymentGateway') as unknown as IPaymentGatewayModelStatic;
		for (const row of rows) {
			if (!row.alias) {
				row.alias = 'custom';
			}

			row.editUrl = this.url(PaymentGateway.getRouteFormByAlias(row.alias), {pk: row.payment_method_id});
		}

		return [this.getMetaResult(), rows];
	}

	sortRules() {
		return {
			default: [{sort: 'asc'}],
			attrs: {
				sort: 'payment_method.sort'
			}
		};
	}
}