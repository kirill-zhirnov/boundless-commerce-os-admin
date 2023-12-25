import DataProvider from '../../../../modules/dataProvider/index';

export default class OrderTransactionsProvider extends DataProvider {
	constructor(options) {
		super(options);

		this.defaults.perPage = false;
	}

	getRules() {
		return [
			['orderId', 'required']
			//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		const orderId = this.getSafeAttr('orderId');

		if (!orderId) {
			throw new Error('You must specify orderId!');
		}

		const langId = this.getEditingLang().lang_id;

		this.q.field('pt.payment_transaction_id');
		this.q.field('pt.payment_method_id');
		this.q.field('pt.status');
		this.q.field('pt.mark_up_amount');
		this.q.field('pt.total_amount');
		this.q.field('pt.external_id');
		this.q.field('pt.person_id');
		this.q.field('pt.created_at');
		this.q.field('p.email as person_email');
		this.q.field('pp.first_name as person_first_name');
		this.q.field('pp.last_name as person_last_name');
		this.q.field('payment_method_text.title as payment_method_title');

		this.q.from('payment_transaction', 'pt');
		this.q.left_join('person', 'p', 'pt.person_id = p.person_id');
		this.q.left_join('person_profile', 'pp', 'pp.person_id = p.person_id');
		this.q.left_join('payment_method_text', null, `payment_method_text.payment_method_id = pt.payment_method_id and payment_method_text.lang_id = ${langId}`);

		this.compare('pt.order_id', orderId);

		//eslint-disable-next-line
		this.q.where(`pt.status in ('completed', 'cancelled', 'exception', 'awaitingForCallback')`);
	}

	//@ts-ignore
	async prepareData(rows) {
		return {transactions: rows};
	}

	sortRules() {
		return {
			default: [{created_at: 'desc'}],
			attrs: {
				created_at: 'pt.created_at'
			}
		};
	}
}
