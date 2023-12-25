import {wrapperRegistry} from './registry/server/classes/wrapper';
import _ from 'underscore';
import punycode from 'punycode';
import {IInstanceConfig} from '../@types/config';
import {TInstanceStatus} from '../@types/instances';

export const CACHE_KEY  = 'instances';

export async function loadInstanceById(instanceId: number): Promise<IInstanceInfo> {
	const data = await loadCachedData();

	if (!(instanceId in data.instances))
		throw new Error(`Instance with ID '${instanceId}' not found!`);

	return data.instances[instanceId];
}

export async function loadInstanceByHost(host: string): Promise<null|IInstanceInfo> {
	const data = await loadCachedData();

	if (host in data.hostsRel) {
		return data.instances[data.hostsRel[host]];
	}

	return null;
}

export async function refreshCache() {
	const cache = wrapperRegistry.getGeneralCache();

	await cache.remove(CACHE_KEY);
	return await loadCachedData();
}

export async function loadCachedData(): Promise<IInstancesAndHostsInfo> {
	const cache = wrapperRegistry.getGeneralCache();
	return await cache.load(CACHE_KEY, async () => await loadRawData());
}

export async function loadRawData(instanceId: number|null = null) {
	const db = wrapperRegistry.getDb();
	let condition;
	if (instanceId) {
		condition = `instance_id = ${db.escape(String(instanceId))}`;
	} else {
		//eslint-disable-next-line
		condition = `instance.status in ('awaitingForClient', 'available', 'unavailable')`;
	}

	const rows = await db.sql<IInstanceRow>(getInstanceSelectSql(condition));

	return prepareDataByRows(rows);
}

export function getInstanceSelectSql(condition: string|null = null) {
	let where = '';
	if (condition != null) {
		where = `where ${condition}`;
	}

	return `select
		instance.*,
		host.host,
		host.our_dns_records,
		host.type as host_type,
		currency.alias as currency_alias,
		tariff.alias as tariff_alias,
		tariff.wix_alias as tariff_wix_alias,
		tariff.billing_period as tariff_billing_period,
		tariff.amount as tariff_amount,
		samples.samples as used_in_samples,
		wix_instance_id,
		case
			when count(feature.alias) = 0 then '{}'
			else json_object_agg(coalesce(feature.alias, ''), tariff_limit.value)
		end as features
	from
		instance
		inner join host using(instance_id)
		left join currency using(currency_id)
		left join tariff using (tariff_id)
		left join tariff_limit using(tariff_id)
		left join feature using(feature_id)
		left join wix_app using(instance_id)
		left join (
			select
				from_instance_id as instance_id,
				array_agg(sample_id) as samples
			from
				sample
			group by
				instance_id
		) as samples using(instance_id)
	${where}
	group by
		instance_id,
		host_id,
		currency.alias,
		tariff.alias,
		tariff.wix_alias,
		tariff.billing_period,
		tariff.amount,
		samples.samples,
		wix_instance_id
	`;
}

export function prepareDataByRows(rows: IInstanceRow[]): IInstancesAndHostsInfo {
	const out: IInstancesAndHostsInfo = {
		instances : {},
		hostsRel : {}
	};

	for (const row of rows) {
		if (!(row.instance_id in out.instances)) {
			//@ts-ignore
			out.instances[row.instance_id] = _.pick(row, [
				'instance_id',
				'path',
				'client_id',
				'status',
				'balance',
				'tariff_id',
				'currency_id',
				'currency_alias',
				'is_demo',
				'is_free',
				'available_since',
				'unavailable_since',
				'paid_till',
				'tariff_alias',
				'tariff_wix_alias',
				'tariff_billing_period',
				'tariff_amount',
				'features',
				'used_in_samples',
				'config',
				'wix_instance_id'
			]);

			out.instances[row.instance_id].hosts = [];
		}

		switch (row.host_type) {
			case TInstanceHostType.primary:
				out.instances[row.instance_id].primary_host = row.host;
				break;

			case TInstanceHostType.system:
				out.instances[row.instance_id].system_host = row.host;
				break;
		}

		out.instances[row.instance_id].hosts.push(row.host);
		out.hostsRel[punycode.toASCII(row.host)] = row.instance_id;
	}

	for (const key in out.instances) {
		// FIXME: hardcoded protocol before we let users integrate their certs
		let protocol = 'http';

		if (!out.instances[key].primary_host) {
			// use https only if user not specified his own domain
			protocol = wrapperRegistry.getConfig().instanceManager.useHttps ? 'https' : 'http';
			out.instances[key].primary_host = out.instances[key].system_host;
		}

		out.instances[key].base_url = `${protocol}://${out.instances[key].primary_host}`;
	}

	return out;
}

export enum TInstanceHostType {
	primary = 'primary',
	system = 'system'
}

export interface IInstanceRow {
	instance_id: number;
	host_type: TInstanceHostType;
	host: string;
}

export interface IInstanceInfo {
	instance_id: number;
	path: string;
	status: TInstanceStatus;
	balance: string;
	tariff_id: number;
	currency_id: number;
	currency_alias: string;
	is_demo: boolean;
	is_free: boolean;
	available_since: Date|null;
	unavailable_since: Date|null;
	paid_till: Date|null;
	tariff_alias: string;
	tariff_wix_alias: string|null;
	tariff_billing_period: string;
	tariff_amount: string;
	features: {
		productLimit: number;
	},
	// used_in_samples: null,
	hosts: string[],
	system_host: string;
	primary_host: string;
	base_url: string;
	config: IInstanceConfig;
	wix_instance_id: null|string;
}

export interface IInstancesAndHostsInfo {
	instances: {
		[key: string]: IInstanceInfo
	},
	hostsRel: {
		[host: string]: number;
	}
}