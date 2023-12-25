import RequestView from './viewRenderer/renderer/request';
import {wrapperRegistry} from './registry/server/classes/wrapper';

export default class Component {
	constructor(env) {
		this.env = env;

		const {instanceRegistry, clientRegistry, session, cookies} = env;

		this.instanceRegistry = instanceRegistry;
		this.clientRegistry = clientRegistry;
		this.session = session;
		this.cookies = cookies;

		this.i18n = env.clientRegistry.getI18n();
	}

	getInstanceRegistry() {
		return this.instanceRegistry;
	}

	getClientRegistry() {
		return this.clientRegistry;
	}

	getUser() {
		if (this.getClientRegistry().hasUser())
			return this.getClientRegistry().getUser();

		return null;
	}

	getDb() {
		return this.instanceRegistry.getDb();
	}

	getModel(name) {
		return this.getDb().model(name);
	}

	getI118n() {
		return this.i18n;
	}

	getLocale() {
		return this.clientRegistry.getLocale();
	}

	getEditingLang() {
		return this.clientRegistry.getEditingLang();
	}

	getLang() {
		return this.clientRegistry.getLang();
	}

	getSite() {
		return this.clientRegistry.getSite();
	}

	__(...args) {
		return this.i18n.__.call(this.i18n, ...args);
	}

	p__(...args) {
		return this.i18n.p__.call(this.i18n, ...args);
	}

	getSetting(...args) {
		const settings = this.getInstanceRegistry().getSettings();

		return settings.get.call(settings, ...args);
	}

	getEnv() {
		return this.env;
	}

	createRequestView() {
		let config = wrapperRegistry.getConfig().viewRenderer.instanceView;
		let theme = this.instanceRegistry.has('theme') ? this.instanceRegistry.get('theme') : null;

		let frontController = this.createFrontControllerMock();

		// тк RequestView имеет зависимость от фронт-контрллера - нужно сделать мок на используемые им функции:
		//не забыть вызвать destroy - чтобы удалить цикличную зависимость!!!
		let requestView = new RequestView(frontController, config, theme);
		frontController.setView(requestView);

		return requestView;
	}

	async createNotification(Func, options = {}) {
		let view = this.createRequestView();

		Object.assign(options, {
			frontController: view.getFrontController()
		});

		let notification = new Func(options);
		await notification.setup();

		return notification;
	}

	async notify(Func, event, ...args) {
		let notification = await this.createNotification(Func);

		let callArgs = [event].concat(args);
		let res = await notification.notify.apply(notification, callArgs);

		notification.getFrontController().destroy();

		return res;
	}

	//Да, это костыль, но время деньги.
	createFrontControllerMock() {
		let frontController = Object.create({
			view: null,
			instanceRegistry: null,
			clientRegistry: null,

			setView(view) {
				//@ts-ignore
				this.view = view;
				return this;
			},

			getView() {
				//@ts-ignore
				return this.view;
			},

			setInstanceRegistry(instanceRegistry) {
				//@ts-ignore
				this.instanceRegistry = instanceRegistry;

				return this;
			},

			getInstanceRegistry() {
				//@ts-ignore
				return this.instanceRegistry;
			},

			setClientRegistry(clientRegistry) {
				//@ts-ignore
				this.clientRegistry = clientRegistry;

				return this;
			},

			getClientRegistry() {
				//@ts-ignore
				return this.clientRegistry;
			},

			url(...args) {
				//@ts-ignore
				let router = this.clientRegistry.getRouter();

				return router.url(...args);
			},

			addBackgroundPromise() {},

			destroy() {
				//@ts-ignore
				if (this.view)
					//@ts-ignore
					this.view.destroy();

				//@ts-ignore
				this.view = null;
				//@ts-ignore
				this.instanceRegistry = null;
				//@ts-ignore
				this.clientRegistry = null;
			}
		});

		frontController
			.setClientRegistry(this.getClientRegistry())
			.setInstanceRegistry(this.getInstanceRegistry())
		;

		return frontController;
	}
}