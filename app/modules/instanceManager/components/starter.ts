import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import Creator from './creator';
import CreatorFromSample from './creator/fromSample';
import BasicComponent from './basic';
import randomString from 'random-string';
import OrdersDemoFiller from '../../../packages/system/modules/populateDemo/orders';
import cryptoMd5 from 'crypto-md5';
import ExtendedSequelize from '../../db/sequelize';
import SubDomainUpdater from './subDomainUpdater';
import {IConfig, IInstanceConfig} from '../../../@types/config';
import {IPerson} from '../../../@types/person';
import {IInstanceModel, IInstanceModelStatic} from '../models/instance';
import CustomError, {TCustomErrorCode} from '../errors/CustomError';
import InstanceMails from '../mails/instanceMails';
import {validateSubdomain} from '../helpers/subDomainValidator';

export default class Starter extends BasicComponent {
	private readonly config: IConfig;
	private readonly authConf: IAuthConf
	private instanceRoot: string
	private instanceConfig: IInstanceConfig
	private instanceDb: ExtendedSequelize
	private sendEmailNotification: boolean = true;
	private setupS3DemoFiles: boolean = true;
	private shallPopulateWithDemoOrder: boolean = true;

	constructor(
		private readonly clientId,
		private readonly email,
		private readonly sampleAlias = null,
		private readonly subDomain = null
	) {
		super();

		this.email = email;
		this.sampleAlias = sampleAlias;
		this.subDomain = subDomain;

		this.config = wrapperRegistry.getConfig();

		this.instanceRoot = null;
		this.instanceConfig = null;
		this.instanceRegistry = null;
		this.instanceDb = null;
		this.authConf = {};
	}

	public getAuthConf() {
		return this.authConf;
	}

	public getInstance() {
		return this.instance;
	}

	public async start() {
		await this.bindClient();
		await this.loadConfig();
		await this.setupAuth();
		await this.setupMailSettings();
		await this.createAuthUrl();

		if (this.shallPopulateWithDemoOrder) {
			await this.populateOrders();
		}

		await this.setupCleanUpSettings();
		await this.refreshInstancesCache();
		await this.triggerRefreshInstanceInfo();

		if (this.sendEmailNotification) {
			await this.sendCreatedNotification();
		}
	}

	public setSendEmailNotification(val: boolean) {
		this.sendEmailNotification = val;
		return this;
	}

	private async setupMailSettings() {
		await this.instanceDb.sql(`
			update
				setting
			set
				value = :value
			where
				setting_group = 'mail'
				and key = 'settings'
		`, {
			value: JSON.stringify({
				from: 'info@boundless-commerce.com',
				replyTo: this.email
			})
		});
	}

	private async setupAuth() {
		const [personRow] = await this.instanceDb.sql<IPerson>(`
				update
					person
				set email         = :email,
						registered_at = now(),
						created_at    = now(),
						is_owner      = true
				where email = 'info@sellios.ru'
				RETURNING *
			`, {email: this.email});

		if (!personRow) {
			throw new Error('person table should contain a row with info@sellios.ru');
		}

		this.authConf.userId = personRow.person_id;
		this.authConf.userPass = randomString({
			length: 4,
			numeric: true,
			letters: false,
			special: false
		});

		await this.instanceDb.sql(`
			update
				person_auth
			set pass = crypt(:pass, gen_salt('bf'))
			where person_id = :id
		`, {pass: this.authConf.userPass, id: this.authConf.userId}
		);

		await this.instanceDb.sql(`
			insert into person_role_rel
				(person_id, role_id)
			select :personId,
						 role_id
			from role
			where alias in ('guest', 'admin')
			on conflict
				do nothing
		`, {
			personId: this.authConf.userId
		});

		this.authConf.token1 = randomString({length: 30});
		this.authConf.token2 = randomString({
			length: 10,
			letters: false,
			numeric: true,
			special: false
		});

		const [{token_id}] = await this.instanceDb.sql<{token_id: number}>(`
			insert into person_token
				(person_id, type, token_1, token_2)
			values (:person, :type, :token1, :token2)
			RETURNING *
		`, {
			person: this.authConf.userId,
			type: 'url',
			token1: this.authConf.token1,
			token2: this.authConf.token2
		});

		this.authConf.tokenId = token_id;
	}

	private loadConfig() {
		this.instanceConfig = this.instanceRegistry.getConfig();
	}

	private async bindClient() {
		if (this.subDomain) {
			validateSubdomain(this.subDomain);

			const [alias] = await this.db.sql(`
				insert into instance_alias(client_id, alias)
				values (:client_id, :alias)
				on conflict do nothing
				returning *
			`, {client_id: this.clientId, alias: this.subDomain});

			if (!alias) {
				throw new CustomError(
					TCustomErrorCode.SubdomainTaken,
					`Subdomain '${this.subDomain}' is taken. Please, choose another one.`
				);
			}
		}

		const params = {
			client: this.clientId,
			email: this.email,
			sample: undefined
		};

		let instanceWhere = 'and sample.alias is null';
		if (this.sampleAlias) {
			instanceWhere = 'and sample.alias = :sample';
			params.sample = this.sampleAlias;
		}

		try {
			await this.db.sql(`
				update
					instance
				set
					client_id = :client,
					client_email = :email
				where
					instance_id in (
						select
							instance.instance_id
						from
							instance
							left join sample on instance.from_sample_id = sample.sample_id
						where
							instance.status = 'awaitingForClient'
							and instance.client_id is null ${instanceWhere}
						limit 1
					)
			`, params);
			const row = await (this.db.model('instance') as IInstanceModelStatic).findOne({
				where: {
					client_id: this.clientId,
					status: 'awaitingForClient'
				}
			});
			let instance: IInstanceModel;
			if (row) {
				instance = row;
			} else {
				instance = await this.createInstance();
			}

			const {demoDays} = wrapperRegistry.getConfig().instanceManager;
			await instance.changeStatus({
				status: 'available',
				client_id: this.clientId,
				available_since: this.db.fn('now'),
				paid_till: ExtendedSequelize.literal(`now() + interval '${demoDays} days'`),
				is_demo: true,
				client_email: this.email
			}, {
				action: 'bindClient',
				data: {
					client_id: this.clientId
				}
			});

			this.instance = instance;
			this.instanceRoot = `${wrapperRegistry.getConfig().instancesPath}/${this.instance.path}`;
			await this.getInstanceRegistry();
			this.instanceDb = this.instanceRegistry.getDb();

			if (this.subDomain) {
				await new SubDomainUpdater(this.instanceRegistry, this.instance, this.subDomain).update();
			}
		} catch (e) {
			await this.db.sql('delete from instance_alias where alias = :alias', {alias: this.subDomain});
			return Promise.reject(e);
		}
	}

	private async createInstance(): Promise<IInstanceModel> {
		let creator;

		if (this.sampleAlias) {
			creator = new CreatorFromSample(this.sampleAlias);
		} else {
			creator = new Creator();
		}

		creator.setSetupS3DemoFiles(this.setupS3DemoFiles);

		await creator.create();
		return creator.getInstance();
	}

	private createAuthUrl() {
		const instanceInfo = this.instanceRegistry.getInstanceInfo();

		const params = {
			id: this.authConf.tokenId,
			token1: this.authConf.token1,
			token2: this.authConf.token2,
			url: '/',
			sign: undefined
		};

		this.authConf.authUrl = `${instanceInfo.base_url}/auth/login/byUrl?${this.getAuthParams(params)}`;

		params.url = '/admin';
		delete params.sign;

		this.authConf.authUrlAdmin = `${instanceInfo.base_url}/auth/login/byUrl?${this.getAuthParams(params)}`;
		this.authConf.baseUrl = instanceInfo.base_url;

	}

	private getAuthParams(params) {
		let key, val;
		const str = [this.instanceConfig.auth.salt];

		for (key in params) {
			val = params[key];
			str.push(`${key}=${val}`);
		}

		params.sign = cryptoMd5(str.join('|'), 'hex');

		const getStr = [];
		for (key in params) {
			val = params[key];
			getStr.push(`${key}=${encodeURIComponent(val)}`);
		}

		return getStr.join('&');
	}

	private async populateOrders() {
		const [row] = await this.instanceDb.sql<{total: number}>(`
			select count(*) as total
			from product
			where
				status = 'published'
				and deleted_at is null
		`);

		if (row.total > 0) {
			const demoFiller = new OrdersDemoFiller(this.instanceRegistry);
			await demoFiller.populate();
		}
	}

	private async setupCleanUpSettings() {
		const [userId] = await this.instanceDb.sql<{max: number}>(`
			select
				max(person_id)
			from
				person
		`);

		const [productId] = await this.instanceDb.sql<{max: number}>(`
			select
				max(product_id)
			from
				product
		`);

		const [categoryId] = await this.instanceDb.sql<{max: number}>(`
			select
				max(category_id)
			from
				category
		`);

		const [orderId] = await this.instanceDb.sql<{max: number}>(`
			select
				max(order_id)
			from
				orders
		`);

		await this.instanceDb.sql(`
			insert into	setting
				(setting_group, key, value)
			values
				('system', 'cleanUpPks', :value)
			on conflict (key, setting_group) do update
			set value = :value
		`, {
			value: JSON.stringify({
				max_user_id: userId.max || 0,
				max_order_id: orderId.max || 0,
				max_product_id: productId.max || 0,
				max_category_id: categoryId.max || 0,
			})
		});
	}

	protected async sendCreatedNotification() {
		try {
			const mail = new InstanceMails();
			await mail.sendInstanceCreated(this.email, this.authConf);
		} catch (e) {
			console.error(e);
		}
	}

	setSetupS3DemoFiles(val: boolean) {
		this.setupS3DemoFiles = val;
		return this;
	}

	setShallPopulateWithDemoOrder(val: boolean) {
		this.shallPopulateWithDemoOrder = val;
		return this;
	}
}

export type IAuthConf = {
	userId?: number,
	userPass?: string,
	token1?: string,
	token2?: string,
	tokenId?: number,
	authUrl?: string,
	authUrlAdmin?: string,
	baseUrl?: string
}
