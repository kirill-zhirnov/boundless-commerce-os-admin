import {IFrontController} from '../../../@types/frontController';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IEnv} from '../../../@types/env';
import {create as createEnv} from '../../env';
import RequestView from '../../viewRenderer/renderer/request';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';

export default class FrontControllerMock implements IFrontController {
	protected env: IEnv;
	protected view: RequestView;

	constructor(
		protected instanceRegistry: IInstanceRegistry
	) {
	}

	async setup() {
		await this.getEnv();
	}

	getInstanceRegistry() {
		return this.instanceRegistry;
	}

	getClientRegistry() {
		return this.env.clientRegistry;
	}

	getView(): RequestView {
		if (!this.view) {
			const viewConfig = wrapperRegistry.getConfig().viewRenderer.instanceView;
			this.view = new RequestView(this, viewConfig);
		}

		return this.view;
	}

	//@ts-ignore
	makeBbCollection() {
		throw new Error('Method not supported');
	}

	//@ts-ignore
	runInternal() {
		throw new Error('Method not supported');
	}

	//@ts-ignore
	getRequest() {
		throw new Error('Method not supported');
	}

	async getEnv() {
		if (!this.env) {
			this.env = await createEnv(this.instanceRegistry).getEnv();
		}

		return this.env;
	}
}