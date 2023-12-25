import ExtendedSequelize from '../../../db/sequelize';
import {IInstanceConfig} from '../../../../@types/config';
import WidgetsRegistry from '../../../registry/client/widgets.client';
import Router from '../../../router/router';
import Settings from '../../../../packages/system/modules/settings';
import Tariff from '../../../../packages/system/modules/tariff';
import {wrapperRegistry} from './wrapper';
import {IInstanceInfo} from '../../../instances';
import _ from 'underscore';
import Cache from '../../../cache';
// import Langs from '../../../../packages/system/modules/langs';
import {ICurrencyRow} from '../../../../packages/system/models/currency';
import {IEnv} from '../../../../@types/env';
import {create as createEnv} from '../../../env';
import SiteDetector from '../../../../packages/system/modules/siteDetector';
import {IQueueEventPublisher} from '../../../../@types/rabbitMq';
import QueueEventPublisher from '../../../rabbitMq/eventPublisher';
import {IInstanceRegistry} from '../../../../@types/registry/instanceRegistry';

export default class InstanceRegistry implements IInstanceRegistry {
	protected instanceInfo: IInstanceInfo;
	protected config: IInstanceConfig;
	protected db: ExtendedSequelize;
	protected widgets: WidgetsRegistry;
	protected router: Router;
	protected settings: Settings;
	protected tariff: Tariff;
	protected cache: Cache;
	// protected langs: Langs;
	protected currency: ICurrencyRow;
	protected siteDetector: SiteDetector;
	protected eventPublisher: IQueueEventPublisher;

	constructor(instanceInfo: IInstanceInfo) {
		this.instanceInfo = instanceInfo;
	}

	public getDb(): ExtendedSequelize {
		if (!this.db) {
			const instanceConfig = this.getConfig();
			const wrapperConfig = wrapperRegistry.getConfig();
			this.db = new ExtendedSequelize(
				instanceConfig.db.name,
				instanceConfig.db.user,
				instanceConfig.db.pass,
				ExtendedSequelize.getConstructOptions(wrapperConfig.instanceDb.config)
			);
		}

		return this.db;
	}

	public setDb(db: ExtendedSequelize) {
		this.db = db;
		return this;
	}

	public getConfig(): IInstanceConfig {
		return this.instanceInfo.config;
	}

	public getWidgets(): WidgetsRegistry {
		if (!this.widgets) {
			this.widgets = new WidgetsRegistry();
		}

		return this.widgets;
	}

	public getRouter(): Router {
		if (!this.router) {
			this.router = new Router(_.extend({}, wrapperRegistry.getConfig().router, {
					baseUrl: this.instanceInfo.base_url
				})
			);
		}

		return this.router;
	}

	public getSettings(): Settings {
		if (!this.settings) {
			this.settings = new Settings(this);
		}

		return this.settings;
	}

	public getTariff(): Tariff {
		if (!this.tariff) {
			this.tariff = new Tariff(this, this.instanceInfo.features, this.instanceInfo.tariff_alias);
		}

		return this.tariff;
	}

	public getInstancePath(): string {
		return `${wrapperRegistry.getConfig().instancesPath}/${this.getInstanceInfo().path}`;
	}

	public getMediaPath(): string {
		return `${this.getInstancePath()}/home/media`;
	}

	public getDataPath(): string {
		return `${this.getMediaPath()}/data`;
	}

	public getCache(): Cache {
		if (!this.cache) {
			this.cache = new Cache(wrapperRegistry.getConfig().cache, this);
		}

		return this.cache;
	}

	// public getLangs(): Langs {
	// 	if (!this.langs) {
	// 		this.langs = new Langs(this);
	// 	}
	//
	// 	return this.langs;
	// }

	public setCurrency(currency: ICurrencyRow) {
		this.currency = currency;
		return this;
	}

	public getCurrency(): ICurrencyRow {
		return this.currency;
	}

	public hasCurrency(): boolean {
		return !_.isUndefined(this.currency);
	}

	public getInstanceInfo(): IInstanceInfo {
		return this.instanceInfo;
	}

	public setInstanceInfo(instanceInfo: IInstanceInfo): InstanceRegistry {
		this.instanceInfo = instanceInfo;
		return this;
	}

	public async makeEnv(): Promise<IEnv> {
		return await createEnv(this).getEnv();
	}

	public getSiteDetector(): SiteDetector {
		if (!this.siteDetector) {
			this.siteDetector = new SiteDetector(this);
		}

		return this.siteDetector;
	}

	public getStaticServerUrl(path = ''): string {
		const config = this.getConfig();
		let url = `${config.staticServer.protocol}://${config.staticServer.host}`;

		if (path) {
			url += '/' + path;
		}

		return url;
	}

	public getMediaUrl(relativePath: string): string {
		return this.getStaticServerUrl(`media/${relativePath}`);
	}

	public getEventPublisher(): IQueueEventPublisher {
		if (!this.eventPublisher) {
			this.eventPublisher = new QueueEventPublisher(this.instanceInfo.instance_id);
		}

		return this.eventPublisher;
	}
}