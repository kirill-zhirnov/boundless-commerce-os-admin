import BasicForm from '../../../../../modules/form';

export default class CreatePaymentMethod extends BasicForm<IAttrs> {
	protected availableGateways: IGateway[] = [];
	protected addedGateway?: IGateway;

	getRules() {
		return [
			['payment_gateway_id', 'required'],
			['payment_gateway_id', 'validatePaymentGateway']
		];
	}

	async save() {
		const gatewayId = this.getSafeAttr('payment_gateway_id');
		const gateway = this.availableGateways
			.find(({payment_gateway_id}) => payment_gateway_id == gatewayId)
		;

		if (!gateway) {
			throw new Error('Gateway is not found.');
		}

		this.addedGateway = gateway;

		const [row] = await this.getDb().sql<{payment_method_id: number}>(`
			insert into payment_method
				(site_id, payment_gateway_id, sort)
			select
				:siteId,
				:paymentGatewayId,
				coalesce(max(sort), 0) + 10
			from
				payment_method
			returning *
		`, {
			siteId : this.getEditingSite().site_id,
			paymentGatewayId : gatewayId
		});
		this.pk = row.payment_method_id;

		await this.getDb().sql(`
			update
				payment_method_text
			set
				title = :title
			where
				payment_method_id = :id
				and lang_id = :lang
		`, {
			id: this.pk,
			lang: this.getEditingLang().lang_id,
			title: gateway.title
		});
	}

	async getTplData() {
		const data = await super.getTplData();

		Object.assign(data, {
			availableGateways: this.availableGateways
		});

		return data;
	}

	async setup() {
		await super.setup();
		await this.fetchAvailableGateways();
	}

	validatePaymentGateway() {
		this.attributes.payment_gateway_id = Number(this.attributes.payment_gateway_id) || 0;
		const gateway = this.availableGateways.find(({payment_gateway_id}) => payment_gateway_id == this.attributes.payment_gateway_id);

		if (!gateway) {
			this.addError('payment_gateway_id', 'notInList', this.__('String is not in a list of allowed values.'));
			return;
		}
	}

	async fetchAvailableGateways() {
		this.availableGateways = await this.getDb().sql<IGateway>(`
			select
				payment_gateway_id,
				alias,
				title,
				description
			from
				payment_gateway
				inner join payment_gateway_text using(payment_gateway_id)
			where
				lang_id = :lang
			order by
				sort asc
		`, {
			lang : this.getEditingLang().lang_id
		});
	}

	getAddedGateway(): IGateway|undefined {
		return this.addedGateway;
	}
}

interface IAttrs {
	payment_gateway_id: number
}

interface IGateway {
	payment_gateway_id: number,
	alias: null|string,
	title: string,
	description: null|string
}