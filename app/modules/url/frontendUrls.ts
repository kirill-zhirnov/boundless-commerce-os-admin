import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';

export default class FrontEndUrls {
	protected urlSettings: IUrlSettings = null;
	constructor(protected instanceRegistry: IInstanceRegistry){}

	async getLoginUrl(): Promise<string|false> {
		const {site, loginUrl} = this.urlSettings || await this.getUrlSettings();

		if (!site || !loginUrl)
			return false;

		return `${site}${loginUrl}`;
	}

	async getOrderUrlByOrderId(publicOrderId: string, state: string = ''): Promise<string|false> {
		const {site, orderUrl} = this.urlSettings || await this.getUrlSettings();
		if (!site || !orderUrl) return false;

		let url = `${site}${orderUrl}`.replace('{PUBLIC_ID}', publicOrderId);
		url = url.replace('{STATE}', state);
		if (url.endsWith('/')) {
			url = url.substr(0, url.length - 1);
		}

		return url;
	}

	async getProductUrl(product: {url_key: string, product_id: number}): Promise<string|false> {
		const {url_key, product_id} = product;
		if (!url_key && !product_id) return false;

		return await this.getProductUrlByKeyOrId(url_key || String(product_id));
	}

	async getProductUrlByKeyOrId(key: string|number): Promise<string|false> {
		if (!key) return false;

		const {site, productUrl} = this.urlSettings || await this.getUrlSettings();
		if (!site || !productUrl) return false;

		return `${site}${productUrl}`.replace('{ALIAS_OR_ID}', String(key));
	}

	async getProductBaseUrl(): Promise<string|false> {
		const {site, productUrl} = this.urlSettings || await this.getUrlSettings();
		if (!site || !productUrl) return false;

		return `${site}${productUrl}`.replace('{ALIAS_OR_ID}', '');
	}

	async getCategoryUrlByKey(key: string = ''): Promise<string|false> {
		const {site, categoryUrl} = this.urlSettings || await this.getUrlSettings();
		if (!site || !categoryUrl) return false;

		return `${site}${categoryUrl}`.replace('{ALIAS_OR_ID}', key);
	}

	async getSiteUrl(): Promise<string|false> {
		const {site} = this.urlSettings || await this.getUrlSettings();

		return site || false;
	}

	async getUrlSettings(): Promise<IUrlSettings> {
		this.urlSettings = await this.instanceRegistry.getSettings().get('system', 'frontendUrls');
		return this.urlSettings;
	}
}

interface IUrlSettings {
	site: string;
	orderUrl: string;
	productUrl: string;
	categoryUrl: string;
	loginUrl: string;
}