import Form from '../../../../modules/form/index';
import validator from '../../../../modules/validator/validator';

interface IAttrs {
	name: string;
	url: string;
	secret?: string | null;
	sign?: string;
}

export default class WebhookForm extends Form<IAttrs, {[key: string]: any}> {
	protected maxWebhooksCount: number = 3;

	getRules() {
		return [
			['name, url', 'required'],
			['url', 'isURL', {require_protocol: true}],
			['name', 'trim'],
			['name', 'validateName'],
			['url', 'validateUrl'],
			['secret', 'validateSecret'],
			['sign', 'safe']
		];
	}

	async save() {
		const {name, url, secret, sign} = this.getSafeAttrs();

		if (this.pk) {
			await this.getDb().sql(`
				update
					webhook
				set
					name = :name,
					url = :url,
					secret = :secret
				where
					webhook_id = :id
			`, {
				name,
				url,
				secret: sign ? secret : null,
				id: this.pk
			});
		} else {
			await this.getDb().sql(`
				insert into	webhook
					(name, url, secret)
				values
					(:name, :url, :secret)
			`, {
				name,
				url,
				secret: sign ? secret : null
			});
		}
	}

	async loadRecord() {
		const [row] = await this.getDb().sql(`
			select
				*
			from
				webhook
			where
				webhook_id = :id
		`, {
			id: this.pk
		});

		return row;
	}

	setupAttrsByRecord() {
		const attrs = this.record;
		if (this.record.secret) {
			Object.assign(attrs, {sign: '1'});
		}

		this.setAttributes(attrs);
	}

	async validateSecret(value, options, field) {
		if (!validator.trim(value) && this.attributes.sign)
			this.addError(field, 'required', 'Value cannot be blank.');

		return true;
	}

	async validateUrl(value, options, field) {
		const [row] = await this.getDb().sql<{webhook_id: number}>(`
			select
				webhook_id
			from
				webhook
			where
				lower(url) = lower(:url)
		`, {
			url: value
		});

		if (row && row.webhook_id != Number(this.pk))
			this.addError(field, 'notUnique', 'Webhook with this url already exists.');

		return true;
	}

	async validateName(value, options, field) {
		if (!this.record) {
			const [sum] = await this.getDb().sql<{total:string}>(`
				select
					count(*) as total
				from
					webhook
			`);

			if (parseInt(sum.total) > 2) {
				this.addError(field, 'limitReached', 'You cannot have more than 3 webhooks.');

				return true;
			}
		}

		const [row] = await this.getDb().sql<{webhook_id: number}>(`
			select
				webhook_id
			from
				webhook
			where
				lower(name) = lower(:name)
		`, {
			name: value
		});

		if (row && row.webhook_id != Number(this.pk))
			this.addError(field, 'notUnique', 'Webhook with this name already exists.');

		return true;
	}
}