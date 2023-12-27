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
		console.log('--- SystemPlugin.onBeforeExpressRun');
		if (this.checkOnSystemRedirect()) {
			console.log('--- SystemPlugin.in system redirect');
			return {stopProcessing: true};
		}

		const clientRegistry = this.getClientRegistry();
		clientRegistry.setInstanceExporter(new InstanceExporter());
		clientRegistry.setUniqueId(new UniqueId(this.getFrontController().getRequest().session));
		clientRegistry.setWidgetsCache(new ClientCache());
		console.log('--- SystemPlugin.before setupSite');
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
	onAfterAction(controller, answer) {
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

	async setupSite() {
		const site = await this.getInstanceRegistry().getSiteDetector().getSite(
			this.frontController.getRequest().hostname
		);
		console.log('--- site:', site);
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
