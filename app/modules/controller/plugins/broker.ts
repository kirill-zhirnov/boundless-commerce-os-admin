import FrontController from '../front';
import BasicPlugin from './basicPlugin';
import utils from '../../utils/common.client';
import _ from 'underscore';
import BasicController from '../basic';
import Answer from '../response/answer';

export default class PluginBroker {
	protected plugins: {[key: string]: BasicPlugin} = {};

	constructor(protected frontController: FrontController) {
	}

	addPlugin(name: string, instance: BasicPlugin) {
		this.plugins[name] = instance;
		return this;
	}

	async trigger(eventName: string, args = []): Promise<any[]> {
		const method = `on${utils.ucfirst(eventName)}`;

		const out = [];
		// eslint-disable-next-line
		for (const [key, plugin] of Object.entries(this.plugins)) {
			if (plugin[method]) {
				// eslint-disable-next-line prefer-spread
				const pluginResult = await plugin[method].apply(plugin, args);
				out.push(pluginResult);

				if (pluginResult && pluginResult.stopProcessing === true) {
					break;
				}
			}
		}

		return out;
	}

	async beforeExpressRun(route: {route: string, method: string}): Promise<void|{stopProcessing: boolean}> {
		const result = await this.trigger('beforeExpressRun', [route]);

		for (const item of result) {
			if (item && _.isObject(item)) {
				//@ts-ignore
				return item;
			}
		}
	}

	async beforeActionRun(controller: BasicController): Promise<void|Answer> {
		const result = await this.trigger('beforeActionRun', [controller]);

		for (const answer of result) {
			if (answer instanceof Answer) {
				return answer;
			}
		}
	}

	async afterAction(controller, answer) {
		await this.trigger('afterAction', [controller, answer]);

		return answer;
	}
}