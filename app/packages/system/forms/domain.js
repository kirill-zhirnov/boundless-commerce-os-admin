import Form from '../../../modules/form/index';
import DomainManager from '../modules/domainManager';
import RobotsGenerator from '../modules/robotsGenerator';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';

export default class Domain extends Form {
	getRules() {
		return [
			['domain', 'required'],
			['domain', 'trim'],
			['domain', 'isFQDN'],
			['domain', 'isUniqueDomain'],
			['domain', 'isNotInternal'],
			['domain', 'validateWWW']
		];
	}

	async getTplData() {
		const data = await super.getTplData();

		const site = this.getEditingSite();

		//@ts-ignore
		data.site = {
			internal: site.system_host || site.host,
			primary: site.host
		};

		//@ts-ignore
		data.attrs.ip = wrapperRegistry.getConfig().ARecordIp;

		return data;
	}

	async save() {
		const site = this.getEditingSite();
		const domain = this.getSafeAttr('domain');

		//@ts-ignore
		const dm = new DomainManager(this.getInstanceRegistry(), site);
		await dm.setDomainName(domain);
		const rg = new RobotsGenerator(this.getInstanceRegistry());
		await rg.checkAndSet(domain);
		await this.getInstanceRegistry().getSettings().set('system', 'redirectSystemToPrimary', false);
	}

	async isUniqueDomain() {
		const site = this.getEditingSite();
		if ((site.system_host === this.attributes.domain) || (site.host === this.attributes.domain)) {
			return;
		}

		this.attributes.domain = String(this.attributes.domain).toLowerCase();

		const rows = await wrapperRegistry.getDb().sql(`
			select
				*
			from
				host
			where
				host = :host
		`, {
			host: this.attributes.domain
		});

		if (rows.length > 0) {
			this.addError('domain', 'notUnique', this.__('The domain already used. If you think that it is error - please contact with support team.'));
		}
	}

	validateWWW() {
		if (this.hasErrors('domain')) {
			return;
		}

		if (/^www\./.test(this.attributes.domain)) {
			this.addError('domain', 'noWWW', this.__('Please specify domain name without www. prefix.'));
			return;
		}
	}

	isNotInternal(value) {
		const regExp = new RegExp(`.${wrapperRegistry.getConfig().instanceManager.hostForSubDomains}$`);

		if (regExp.test(value) && (value !== this.getEditingSite().system_host)) {
			this.addError('domain', 'isInternal', this.__('You can not use internal domain except the one you already have.'));
			return;
		}

	}
}