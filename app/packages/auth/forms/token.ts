import BasicForm from '../../../modules/form/index';
import randomString from 'random-string';
import jwt from 'jsonwebtoken';
import {IApiTokenModel, IApiTokenModelStatic} from '../models/apiToken';
import {IApiToken} from '../../../@types/auth';

interface IAttrs {
	name: string;
	can_manage: string | null;
	client_id: string | null;
	secret: string | null;
	permanent_token: string | null;
}

export default class Token extends BasicForm<IAttrs, IApiTokenModel> {
	getRules() {
		return [
			['name', 'required'],
			['name', 'trim'],
			['name', 'validateName'],
			['client_id, secret, permanent_token, can_manage', 'safe'],
		];
	}

	async save() {
		const {name, can_manage} = this.getSafeAttrs();

		if (this.pk) {
			this.record.set({
				name,
				can_manage: can_manage == '1'
			});
			await this.record.save();
		} else {
			await this.createNewToken(name);
		}
	}

	async loadRecord() {
		return await (this.getModel('apiToken') as IApiTokenModelStatic).findException({
			where: {
				token_id: this.pk
			}
		}) as IApiTokenModel;
	}

	setupAttrsByRecord() {
		const {can_manage, ...attrs} = this.record.toJSON() as IApiToken;

		this.setAttributes({
			...attrs,
			can_manage: can_manage ? 1 : 0
		});
	}

	async validateName(value, options, field, attrs) {
		const {name} = attrs;

		if (['__wix-shop', '__boundless-system'].includes(name)) {
			this.addError(field, 'unique', this.__('Token name should be unique.'));
			return false;
		}

		const [row] = await this.getDb().sql(`
			select
				1
			from
				api_token
			where
				name = :name
				and token_id != :token_id
		`, {
			name,
			token_id: this.pk || 0
		});

		if (row) {
			this.addError(field, 'unique', this.__('Token name should be unique.'));
			return false;
		}

		return true;
	}

	async createNewToken(name) {
		const {token_id, client_id} = await this.createUniqueClientId();
		const secret = randomString({
			length: 66,
			numeric: true,
			letters: true,
			special: false
		});
		this.pk = token_id;
		const {instance_id} = this.getInstanceRegistry().getInstanceInfo();

		const permanent_token = jwt.sign({
			iId: instance_id,
			cId: client_id
		}, secret, {algorithm: 'HS512'});


		await this.getDb().sql(`
			update api_token
			set
				name = :name,
				secret = :secret,
				permanent_token = :permanent_token
			where
				token_id = :token_id
		`, {
			token_id,
			name,
			secret,
			permanent_token
		});
	}

	async createUniqueClientId() {
		const client_id = randomString({
			length: 17,
			numeric: true,
			letters: true,
			special: false
		});

		const [row] = await this.getDb().sql(`
			insert into api_token (client_id)
			values (:client_id)
			on conflict do nothing
			returning *
		`, {client_id});

		if (row) return row;
		return await this.createUniqueClientId();
	}
}