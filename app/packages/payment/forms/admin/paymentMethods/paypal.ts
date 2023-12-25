import BasicPaymentMethodForm, {IAttrs as IBasicAttrs} from './basicPaymentMethod';
import _ from 'underscore';

interface IPaypalFormAttrs extends IBasicAttrs {
	client_id: string;
	secret: string;
	mode: '' | 'live' | 'sandbox';
	return_url: string;
	cancel_url: string;
}

export default class PaypalPaymentMethodForm extends BasicPaymentMethodForm<IPaypalFormAttrs> {
	getRules() {
		return super.getRules().concat([
			['client_id,secret,mode,return_url,cancel_url', 'required'],
			['return_url,cancel_url', 'isURL']
		]);
	}

	async save() {
		const attrs = this.getSafeAttrs();
		const config = _.pick(attrs, [
			'client_id', 'secret', 'mode', 'return_url', 'cancel_url'
		]);

		this.record.config = config;
		await this.record.save();

		return super.save();
	}

	setupAttrsByRecord() {
		super.setupAttrsByRecord();

		if (this.record?.config) {
			Object.assign(
				this.attributes,
				_.pick(this.record.config, ['client_id', 'secret', 'mode', 'return_url', 'cancel_url'])
			);
		}
	}

	rawOptions() {
		return Object.assign(super.rawOptions(), {
			mode: [
				['sandbox', 'Sandbox'],
				['live', 'Live']
			]
		});
	}
}