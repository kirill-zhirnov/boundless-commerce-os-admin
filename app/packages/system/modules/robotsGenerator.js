import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';

export default class RobotsGenerator {
	constructor(instanceRegistry) {
		this.instanceRegistry = instanceRegistry;
	}

	generate(domain, protocol = null) {
		// FIXME: hardcoded protocol before we let users integrate their certs
		if (!protocol) {
			const {
				useHttps
			} = wrapperRegistry.getConfig().instanceManager;
			protocol = this.instanceRegistry.getInstanceInfo().primary_host || !useHttps ? 'http' : 'https';
		}

		let txt = this.getTemplate().replace(/{host}/gm, domain);
		txt = txt.replace(/{protocol}/gm, protocol);

		return txt;
	}

	generateAndSet(domain = null) {
		return this.setInstanceRobots(this.generate(domain));
	}

	async checkAndSet(domain) {
		const txt = await this.getInstanceRobots();

		let res;
		const prevDomain = this.getDomainFromRobots(txt);
		const protocol = this.getProtocolFromRobots(txt);

		if (txt === this.generate(prevDomain, protocol)) {
			this.generateAndSet(domain);
			res = true;
		} else {
			res = false;
		}

		return res;
	}

	getTemplate() {
		return `
			User-Agent: *
			Disallow:
			Host: {host}
			Sitemap: {protocol}://{host}/sitemap.xml
		`;
	}

	getDomainFromRobots(robots) {
		const regExp = /^Host: (.+)$/gm;
		const match = regExp.exec(robots);

		if (match != null) {
			return match[1];
		} else {
			return null;
		}
	}

	getProtocolFromRobots(robots) {
		const regExp = /^Sitemap: (https|http):\/\//gm;
		const match = regExp.exec(robots);

		if (match != null) {
			return match[1];
		} else {
			return null;
		}
	}

	getInstanceRobots() {
		return this.instanceRegistry.getSettings().get('cms', 'robots.txt');
	}

	setInstanceRobots(value) {
		return this.instanceRegistry.getSettings().set('cms', 'robots.txt', value);
	}
}