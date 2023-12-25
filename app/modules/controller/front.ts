import extend from 'extend';
import {Request, Response} from 'express';
import InstanceRegistry from '../registry/server/classes/instance';
import ServerClientRegistry from '../registry/client/server';
import RequestEnvironment from './request/environment.client';
import PluginBroker from './plugins/broker';
import errors from '../errors/errors';
import {wrapperRegistry} from '../registry/server/classes/wrapper';
import BasicController from './basic';
import Answer from './response/answer';
import {Session, SessionData} from 'express-session';
import ExpressAnswerHandler from './response/expressAnswerHandler';
import RequestView from '../viewRenderer/renderer/request';
import BasicPlugin from './plugins/basicPlugin';
import SystemPlugin from './plugins/systemPlugin';
import AuthenticationPlugin from './plugins/authenticationPlugin';
import AuthorizationPlugin from './plugins/authorizationPlugin';
import {IServerClientRegistry} from '../../@types/registry/serverClientRegistry';
import _ from 'underscore';
import pathAlias from 'path-alias';
import {ICollectionConstructor, ICollectionOptions} from '../../@types/backbone';
import {Collection, Model} from 'backbone';
import {IParsedRoute} from '../../@types/router/serverRouter';
import {IFrontController} from '../../@types/frontController';
import {IWidgetOptions} from '../../@types/widget';
import Widget, {WidgetCtor} from '../widget/widget.client';
// import {performance} from 'perf_hooks';

export default class FrontController implements IFrontController{
	protected config: IFrontControllerConfig;
	protected request: Request;
	protected response: Response;
	protected instanceRegistry: InstanceRegistry;
	protected clientRegistry: IServerClientRegistry;
	protected requestEnvironment: RequestEnvironment;
	protected backgroundPromises: Promise<any>[] = [];
	protected pluginBroker: PluginBroker;
	protected bodyParams: {[key: string]: any};
	protected view: RequestView;

	constructor(instanceRegistry: InstanceRegistry, config: Partial<IFrontControllerConfig> = {}) {
		this.instanceRegistry = instanceRegistry;
		this.config = extend(true, {
			errorController : {
				url : 'system/error/view',
				method : 'GET'
			}
		}, config);

		this.clientRegistry = new ServerClientRegistry();
		this.requestEnvironment = new RequestEnvironment(this);
		this.pluginBroker = new PluginBroker(this);
	}

	async runExpress(request: Request, response: Response) {
		this.request = request;
		this.response = response;

		const route = {
			path: request.path,
			method: request.method
		};

		const beforeExpressRunResult = await this.launchPluginAction('beforeExpressRun', [route]);
		if (beforeExpressRunResult && beforeExpressRunResult.stopProcessing === true) {
			return;
		}

		const router = this.instanceRegistry.getRouter();
		const parsedRoute = router.parse(route.path, route.method) as unknown as IParsedRoute;

		const answer = await this.run(parsedRoute);

		// try {
		// 	const timing = performance.measure('processing time', 'front-controller-process');
		// 	if (!response.headersSent) {
		// 		response.setHeader('Timing-Allow-Origin', '*');
		// 		//@ts-ignore
		// 		response.setHeader('Server-Timing', `fc;dur=${timing.duration}`);
		// 	}
		// } catch (e) {
		// 	if (process.env.NODE_ENV !== 'production') {
		// 		console.error(e);
		// 	}
		// }

		const answerHandler = new ExpressAnswerHandler(request, response, answer);
		await answerHandler.process();
	}

	async runInternal(path: string, method = null, params = {}, bodyParams = null) {
		if ((bodyParams != null) && bodyParams) {
//			Тут логическая ошибка: @bodyParams  относится к frontController
//			Но инстанс frontController один на все подзапросы. Тк подзапросы выполняются
// 			параллельно (к примеру несколько виджетов), то последующий подзапрос затирает предыдущий.
//			Чтобы исправить - (как идея) - POST параметры отнести к parsedRoute
			console.error(path, method, params, bodyParams);
			throw new Error('You should not pass bodyParams in internal request. Here is logical bug! See comment.');
		}

		const router = this.instanceRegistry.getRouter();

		if (Array.isArray(path)) {
			path = router.url(...path);
		}

		const parsedRoute = router.parse(path, method) as unknown as IParsedRoute;
		if (!parsedRoute)
			throw new Error('Cannot parse path in internal request');

		parsedRoute.params = extend(true, parsedRoute.params, params);

		return this.run(parsedRoute, true);
	}

	async run(parsedRoute: IParsedRoute, isInternal: boolean = false): Promise<Answer> {
		const controller = this.getController(parsedRoute, isInternal);
		if (!controller)
			throw new errors.HttpError(404, 'Page not found', parsedRoute);

		const beforeActionRunRes = await this.launchPluginAction('beforeActionRun', [controller]);
		if (beforeActionRunRes instanceof Answer)
			return beforeActionRunRes;

		const controllerAnswer = await controller.runAction();
		await this.launchPluginAction('afterAction', [controller, controllerAnswer]);

		return controllerAnswer;
	}

	async launchPluginAction(action: string, args = []) {
		if (action in this.pluginBroker) {
			//eslint-disable-next-line
			return this.pluginBroker[action].apply(this.pluginBroker, args);
		}
	}

	getController(parsedRoute: IParsedRoute, isInternal: boolean): BasicController|false {
		const packageKit = wrapperRegistry.getPackagesKit();
		if (packageKit.has(parsedRoute.package)) {
			const pckg = packageKit.get(parsedRoute.package);
			const Controller = pckg.getController(parsedRoute.controller, parsedRoute.pathPrefix);

			if (typeof(Controller) === 'function') {
				const instance = new Controller(parsedRoute, this);
				instance.setIsInternal(isInternal);

				if (instance instanceof BasicController) {
					return instance;
				}
			}
		}

		return false;
	}

	prepareRejectError(error, parsedRoute: IParsedRoute): errors.ActionError {
		return new errors.ActionError(
			'An error during controller action happened.',
			error,
			parsedRoute
		);
	}

	getInstanceRegistry(): InstanceRegistry {
		return this.instanceRegistry;
	}

	getClientRegistry(): IServerClientRegistry {
		return this.clientRegistry;
	}

	getReqBody() {
		if (this.bodyParams) {
			return this.bodyParams;
		} else if (this.request) {
			return this.request.body;
		}
	}

	getRequest(): Request {
		return this.request;
	}

	getResponse(): Response {
		return this.response;
	}

	getQuery() {
		return this.request.query;
	}

	getRequestEnvironment(): RequestEnvironment {
		return this.requestEnvironment;
	}

	getView(): RequestView {
		if (!this.view) {
			const viewConfig = wrapperRegistry.getConfig().viewRenderer.instanceView;
			this.view = new RequestView(this, viewConfig);
		}

		return this.view;
	}

	addPlugin(name: string, instance: BasicPlugin) {
		this.pluginBroker.addPlugin(name, instance);
		return this;
	}

	makeBbCollection(collection: string|ICollectionConstructor, models: Model[] | Array<Record<string, any>> = null, options: ICollectionOptions = {}): Collection {
		if (_.isString(collection)) {
			const requiredCollection = require(pathAlias.resolve(collection)) as unknown as ICollectionConstructor|{default: ICollectionConstructor};
			//@ts-ignore
			collection = (requiredCollection.default ? requiredCollection.default : requiredCollection) as unknown as ICollectionConstructor;

			// if (collection.default)
			// 	collection = collection.default;
		}

		options.frontController = this;

		return new collection(models, options);
	}

	makeWidget(widget: string|WidgetCtor, options: IWidgetOptions = {}): Widget {
		if (_.isString(widget)) {
			widget = require(pathAlias.resolve(widget)).default;
		}

		options.frontController = this;

		return new (widget as WidgetCtor)(options);
	}
}

export function makeFrontController(instanceRegistry: InstanceRegistry): FrontController {
	const fc = new FrontController(instanceRegistry, wrapperRegistry.getConfig().frontController);

	fc.addPlugin('system', new SystemPlugin(fc));
	fc.addPlugin('authentication', new AuthenticationPlugin(fc));
	fc.addPlugin('authorization', new AuthorizationPlugin(fc));

	return fc;
}

export interface IFrontControllerConfig {
	errorController : {
		url: string;
		method: string;
	}
}

export type TInstanceSession = Session & Partial<SessionData>;