import {IFrontController} from '../../../@types/frontController';
import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IEnv} from '../../../@types/env';
import {create as createEnv} from '../../env';
import RequestView from '../../viewRenderer/renderer/request';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import Backbone from 'backbone';
import Answer from '../response/answer';

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

	makeBbCollection() {
		return new Backbone.Collection();
	}

	async runInternal() {
		return new Answer();
	}

	getRequest() {
		return undefined;
	}

	async getEnv() {
		if (!this.env) {
			this.env = await createEnv(this.instanceRegistry).getEnv();
		}

		return this.env;
	}
}