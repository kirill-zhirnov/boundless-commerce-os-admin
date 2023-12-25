import {wrapperRegistry} from '../registry/server/classes/wrapper';
import {IInstanceInfo, loadRawData, loadCachedData} from '../instances';
import InstanceRegistry from '../registry/server/classes/instance';
import {ICurrencyModelStatic} from '../../packages/system/models/currency';

export class InstanceBootstrapper {
	protected instanceRegistry: InstanceRegistry;

	constructor(protected instanceInfo: IInstanceInfo) {
		this.instanceRegistry = new InstanceRegistry(this.instanceInfo);
	}

	async run() {
		await this.setupPackages();
		await this.loadDefaultCurrency();
	}

	async setupPackages() {
		await wrapperRegistry.getPackagesKit().setupPackagesByInstance(this.instanceRegistry);
	}

	async loadDefaultCurrency() {
		const cache = this.instanceRegistry.getCache();
		const CurrencyModel = this.instanceRegistry.getDb().model('currency') as ICurrencyModelStatic;

		const currency = await cache.load('currency', async () => await CurrencyModel.bootstrapDefaultCurrency(this.instanceRegistry));
		this.instanceRegistry.setCurrency(currency);
	}

	getInstanceRegistry(): InstanceRegistry {
		return this.instanceRegistry;
	}
}

export async function bootstrapInstanceById(instanceId: number, useCache = true, accelerateBootstrap: boolean = false): Promise<InstanceRegistry> {
	const data = await (useCache ? loadCachedData() : loadRawData(instanceId));
	if (!(instanceId in data.instances))
		throw new Error(`Cant bootstrap instance by id: ${instanceId} is not in instances`);

	const instanceInfo = data.instances[instanceId];
	const instanceBootstrapper = new InstanceBootstrapper(instanceInfo);

	if (!accelerateBootstrap) {
		await instanceBootstrapper.run();
	}

	return instanceBootstrapper.getInstanceRegistry();
}
