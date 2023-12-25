import pathAlias from 'path-alias';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import * as instances from '../../../modules/instances';
import fs from 'fs';
import _ from 'underscore';
import childProcess from 'child_process';
import SiteDetector from './siteDetector';
import path from 'path';
import existsFile from 'exists-file';
import punycode from 'punycode';
import {promisify} from 'util';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry'; //eslint-disable-line

const exec = promisify(childProcess.exec);
const writeFile = promisify(fs.writeFile);
const fileExists = promisify(existsFile);
const unlink = promisify(fs.unlink);

export default class DomainManager {
	static async reloadNginx() {
		const cmd = wrapperRegistry.getConfig().instanceManager.nginxReloadCmd;
		if (cmd) {
			await exec(cmd);
		}
	}

	/**
	 * @param {IInstanceRegistry} instanceRegistry
	 * @param site
	 */
	constructor(instanceRegistry, site = null) {
		this.instanceRegistry = instanceRegistry;
		this.site = site;
		this.wrapperdDb = wrapperRegistry.getDb();

		this.instanceInfo = this.instanceRegistry.getInstanceInfo();
		this.instanceId = this.instanceInfo.instance_id;
	}

	async generateNginxConfig(domains) {
		let config = '';

		for (const domain of Array.from(domains)) {
			const cert = await this.getDomainCert(domain);
			config += this.generateServerBlock(domain.host, cert);
			config += '\n';

			if (domain.type === 'primary') {
				config += `${this.generateWwwAliasBlock(domain.host)}\n`;
			}
		}

		return config;
	}

	generateWwwAliasBlock(domain) {
		const encodedDomain = punycode.toASCII(domain);
		const encodedWwwDomain = punycode.toASCII(`www.${domain}`);

		return `
			server {
				server_name ${encodedWwwDomain};

				listen 80;
				rewrite ^(.+)$ http://${encodedDomain}$1 permanent;
			}
		`;
	}

	generateServerBlock(domain, cert) {
		const {baseHostConfig} = wrapperRegistry.getConfig().nginx;
		const includePathBase = baseHostConfig.startsWith('/')
			? baseHostConfig
			: path.join(pathAlias.getRoot(), '..', 'nginx', 'common', baseHostConfig)
			;
		const {useHttps} = wrapperRegistry.getConfig().instanceManager;

		let ssl = '';
		if (useHttps && (cert != null) && (cert.public != null) && (cert.private != null)) {
			const includePathSSL = path.join(pathAlias.getRoot(), '..', 'nginx', 'common', 'ssl.conf');

			ssl = `
				ssl_certificate ${cert.public};
				\tssl_certificate_key ${cert.private};

				\tinclude ${includePathSSL};
			`;
		}

		const encodedDomain = punycode.toASCII(domain);

		return `
			server {
				server_name ${encodedDomain};

				${ssl}

				include ${includePathBase};
			}
		`;
	}

	async getDomainCert(domain) {
		// will be db query, so turn it to promise
		if (domain.type === 'system') {
			return {
				public: path.join(pathAlias.getRoot(), '..', 'nginx', 'cert', wrapperRegistry.getConfig().sslCert.public),
				private: path.join(pathAlias.getRoot(), '..', 'nginx', 'cert', wrapperRegistry.getConfig().sslCert.private)
			};
		} else {
			return false;
		}
	}

	async makeNginxConfig() {
		const domains = await this.getInstanceDomains();
		const conf = await this.generateNginxConfig(domains);
		await this.saveNginxConfig(conf);
	}

	async saveNginxConfig(config) {
		await writeFile(this.getConfigPath(), config);
	}

	async removeNginxConfig() {
		const absolutePath = this.getConfigPath();

		const res = await fileExists(absolutePath);
		if (res) {
			await unlink(absolutePath);
		}
	}

	async setDomainName(domain) {
		if (!this.site) {
			throw new Error('You must specify @site before calling setDomainName.');
		}

		const HostModel = this.wrapperdDb.model('host');
		const SiteModel = this.instanceRegistry.getDb().model('site');

		await HostModel.destroy({
			where: {
				instance_id: this.instanceId,
				type: 'primary',
				site_id: this.site.site_id
			}
		});

		if (domain !== this.site.system_host) {
			await HostModel.create({
				instance_id: this.instanceId,
				host: domain,
				type: 'primary',
				our_dns_records: false,
				site_id: this.site.site_id
			});
		}

		const {
			aliases
		} = this.site;

		if ((domain !== this.site.system_host) && (_.indexOf(this.site.aliases, this.site.system_host) === -1)) {
			aliases.push(this.site.system_host);
		}

		const useHttps = this.site.system_host === domain ? true : false;

		await SiteModel.update({
			host: domain,
			aliases,
			settings: Object.assign(this.site.settings, {
				useHttps
			})
		}, {
			where: {
				site_id: this.site.site_id
			}
		});
		await this.resetCache();

		// await this.makeNginxConfig();
		// await DomainManager.reloadNginx();
	}

	async resetCache() {
		await instances.refreshCache();

		const siteDetector = new SiteDetector(this.instanceRegistry);
		await siteDetector.refreshCache();
	}

	getInstanceDomains() {
		return this.wrapperdDb.sql(`
			select
				host,
				type
			from
				host
			where
				instance_id = :id
				and type in ('system', 'primary')
		`, {
			id: this.instanceId
		});
	}

	getConfigPath() {
		return path.join(pathAlias.getRoot(), '..', 'nginx', 'instances', `${this.instanceInfo.path}.conf`);
	}
}
