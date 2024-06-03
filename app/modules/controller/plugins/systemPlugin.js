import BasicPlugin from './basicPlugin';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import InstanceExporter from '../../instanceSync/exporter';
import UniqueId from '../../uniqueId.client';
import ClientCache from '../../cache/client.client';
import BasicController from '../basic'; //eslint-disable-line
import Answer from '../response/answer'; //eslint-disable-line
import Langs from '../../../packages/system/modules/langs';
import Countries from '../../../packages/system/modules/countries';
import Locale from '../../locale';
import Basket from '../../../packages/orders/modules/basket';

export default class SystemPlugin extends BasicPlugin {
	async onBeforeExpressRun() {
		if (this.checkOnSystemRedirect()) {
			return {stopProcessing: true};
		}

		const clientRegistry = this.getClientRegistry();
		clientRegistry.setInstanceExporter(new InstanceExporter());
		clientRegistry.setUniqueId(new UniqueId(this.getFrontController().getRequest().session));
		clientRegistry.setWidgetsCache(new ClientCache());

		await this.setupSite();
	}

	/**
	 * @param {BasicController} controller
	 * @returns {Promise<void|Answer>}
	 */
	async onBeforeActionRun(controller) {
		await this.setupLangAndLocale();

		const clientRegistry = this.getClientRegistry();
		clientRegistry.setBasket(
			new Basket(this.getInstanceRegistry(), clientRegistry.getUser())
		);

		return this.checkOnUnavailableBlocking(controller);
	}

	/**
	 *
	 * @param {BasicController} controller
	 * @param {Answer} answer
	 */
	async onAfterAction(controller, answer) {
		let currentMenuUrl;
		if (controller.getIsInternal() || !this.isAnswer(answer) || !answer.getPerformWithExpress()) {
			return;
		}

//		We need to add special info only if response type in:
		const responseType = answer.getType();
		if (['tpl', 'widget', 'layout'].indexOf(responseType) === -1) {
			return;
		}

		const globalViewData = {};

//		Mark current menu
		const layout = answer.getLayout();
		if (!('currentMenuUrl' in layout.data)) {
			const parsedRoute = controller.getParsedRoute();
			const params = parsedRoute.params ? parsedRoute.params : {};

			currentMenuUrl = '';
			if (parsedRoute.originalPath && (parsedRoute.originalPath !== '')) {
				currentMenuUrl = controller.url(parsedRoute.originalPath, params);
			}

			answer.setLayoutData('currentMenuUrl', currentMenuUrl);
		}

		if (layout.data.currentMenuUrl) {
			globalViewData.currentMenuUrl = currentMenuUrl;
		}

		if (controller?.getUser()?.hasManagersRole()) {
			const {instance_id} = this.getInstanceRegistry().getInstanceInfo();
			//@ts-ignore
			await wrapperRegistry.getDb().model('instance').markJustUsed(instance_id);
		}

// 		The following block is outdated - Remove me:
//		add information for instance expiration
		if (!controller.isFrontend()) {
			globalViewData.systemPart = controller.getSystemPart();

			const info = this.getInstanceRegistry().getInstanceInfo();
			//@ts-ignore
			if (info.is_demo || (info.status === 'unavailable') || wrapperRegistry.getDb().model('instance').isInstanceExpiredSoon(info)) {
				globalViewData.instanceExpired = 1;
			}

			globalViewData.tariffFeatures = this.getInstanceRegistry().getTariff().getFeatures();
		}

		if (Object.keys(globalViewData).length > 0) {
			answer.addGlobalViewData(globalViewData);
		}

		// const expressReq = this.getFrontController().getRequest();
		// if ((expressReq.method === 'GET') && !expressReq.xhr) {
		// 	return this.preloadWidgetsCache(controller, response);
		// }

	}


	checkOnSystemRedirect() {
		const request = this.getFrontController().getRequest();

		if (request) {
			if ((request.path === '/admin') || (request.path === '/admin/')) {
				this.getFrontController().getResponse().redirect('/dashboard/admin/index');
				return true;
			}
		}

		return false;
	}

	/**
	 *
	 * @param {BasicController} controller
	 * @returns {void|Answer}
	 */
	checkOnUnavailableBlocking(controller) {
		const instanceRegistry = this.getInstanceRegistry();

		if ((instanceRegistry.getInstanceInfo().status !== 'unavailable') || controller.getIsInternal()) {
			return;
		}

//		Need to block request, if it is not admin controller or not in allowedRoutes
		const parsedRoute = controller.getParsedRoute();
		const allowedRoutes = this.getAllowedRoutesForUnavailable();
		if (allowedRoutes.indexOf(parsedRoute.originalPath) !== -1) {
			return;
		}

//		Block request - redirect to error page.
		const answer = this.makeAnswer();
		answer.redirect(controller.url('system/error/unavailable'));

		return answer;
	}

	getAllowedRoutesForUnavailable() {
		return [
			'system/tpl/getTplBundle',
			'system/tpl/getTpl',
			'system/error/unavailable',
			'auth/user/current',
			'auth/login/byUrl',
			'orders/basket/summary',
			'auth/me/changePassword',
			'auth/logout/exit',
			'auth/login/form',
			'cms/navigation/menu',
			'auth/restore/email',
			'auth/restore/password',
			'auth/restore/emailSent',
			'system/style/getCss',
			'cms/image/thumbnail',
			'system/sellios/account/index',
		];
	}

	/*getCurrentUserJson() {
		const user = this.getClientRegistry().getUser();

		let out = {isGuest : true};
		if (!user.isGuest()) {
			const profile = user.getState('profile');

			out = {
				id : user.getId(),
				email : profile.email,
				isGuest : false,
				role : 'customer'
			};

			if (user.isAdmin()) {
				out.role = 'admin';
				out.settings =
					{adminCloseModal : user.getSetting('adminCloseModal')};
			}
		}

		return out;
	}*/

	/*async preloadFrontMenus(controller) {
		const deferred = Q.defer();

		let f = Q();
		for (let menu of ['top', 'category', 'bottom']) {
			(menu => {
				return f = f.then(() => {
					return this.preloadMenuItem(controller, menu);
				});
			})(menu);
		}

		f.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}*/

	/*preloadMenuItem(controller, menu) {
		const deferred = Q.defer();

		const instanceRegistry = this.getInstanceRegistry();
		const db = instanceRegistry.getDb();

		instanceRegistry.getCache().load(db.model('menuItem').getCacheKey(menu), () => {
			const deferredItem = Q.defer();

			controller.createDataProvider('@p-cms/dataProvider/admin/menuItem', {}, {
				item : menu
			})
			.then(dataProvider => {
				return dataProvider.getTreeCollection();
		}).then(collection => {
				return deferredItem.resolve(collection.toJSON());
			}).done();

			return deferredItem.promise;
	}).then(out => {
			this.getClientRegistry().getWidgetsCache().set(`cmsMenu-${menu}`, out);

			return deferred.resolve();
		}).done();

		return deferred.promise;
	}*/

	/*	async preloadWidgetsCache(controller, response) {
		const deferred = Q.defer();

		// this is a shit code, which should be fixed:
		const clientRegistry = this.getClientRegistry();

		const widgetsCache = clientRegistry.getWidgetsCache();
		widgetsCache.set('currentUser', this.getCurrentUserJson());

		const promises = [
			clientRegistry.getBasket().calcSummary()
		];

		if (controller.isFrontend() && (response.getLayout().view !== 'checkout')) {
			promises.push(this.preloadFrontMenus(controller));
		}

		Q.all(promises)
		.spread(basket => {
			widgetsCache.set('basket', basket);

			return deferred.resolve();
	}).done();

		return deferred.promise;
}*/

	async setupSite() {
		const site = await this.getInstanceRegistry().getSiteDetector().getSite(
			this.frontController.getRequest().hostname
		);

		let baseUrl = site.settings.useHttps ? 'https://' : 'http://';
		baseUrl += site.host;

		this.getClientRegistry().setSite(site);
		this.getInstanceRegistry().getRouter().setConfig({baseUrl});
	}

	async setupLangAndLocale() {
		const {default: {lang: langId, country: countryId}} = this.getClientRegistry().getSite();

		const instanceRegistry = this.getInstanceRegistry();
		const lang = await (new Langs(instanceRegistry)).getLangById(langId);
		this.getClientRegistry().setLang(lang);

		const country = await (new Countries(instanceRegistry)).getCountryById(countryId);
		this.getClientRegistry().setCountry(country);

		const i18n = await wrapperRegistry.getI18nKit().createI18n(lang.code);
		this.getClientRegistry().setI18n(i18n);

		const {money, phone, date} = await this.getInstanceRegistry().getSettings().get('system', 'locale');
		const locale = new Locale({
			formatMoneyOptions: money,
			phone: phone,
			formatDateOptions: date,
			currency: this.getInstanceRegistry().getCurrency().alias
		});
		this.getClientRegistry().setLocale(locale);
	}
}
