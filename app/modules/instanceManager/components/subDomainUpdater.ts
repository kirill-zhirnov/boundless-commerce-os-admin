import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IInstanceModel} from '../models/instance';

//mock for the open-source version
export default class SubDomainUpdater {
	constructor(
		private readonly instanceRegistry: IInstanceRegistry,
		private instance: IInstanceModel,
		private readonly subdomain: string
	) {}

	async update() {}
}