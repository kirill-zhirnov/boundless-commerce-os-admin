import {clientRegistry, IImportRegistry} from '../../registry/client/client.client';
import $ from 'jquery';
import aliasesList from '../../../config/pathAliases';
import ClientTheme from '../../theme/client.client';
import pathAlias from 'path-alias';
import Vue from 'vue';
import Vuex from 'vuex';
import vuePluginLocalMethods from '../../../vue/plugins/localMethods.client';
import vuePluginDomListeners from '../../../vue/plugins/domListeners';
import vueComponentWidget from '../../../vue/components/Widget.vue';

pathAlias.setAliases(aliasesList.shouldBeResolved, true);
pathAlias.setAliases(aliasesList.static, false);

import UniqueId from '../../uniqueId.client';
import I18nKit from '../../i18n/kit/basic.client';
import bundles from '../../utils/bundles.client';
import ViewRenderer from '../../viewRenderer/viewRenderer.client';
import Locale from '../../locale';
import {initWidget} from '../../widget/domReady.client';
import {setupClientListeners} from './listeners.client';
import Router from '../../router/basic.client';
import utils from '../../utils/common.client';
import {importInstancesToClient} from '../../instanceSync/importer.client';
import serializeObjectPlugin from '../../jquery/plugins/serializeObject.client';

import 'bootstrap/js/dist/dropdown';

// import 'bootstrap/js/transition';
import 'bootstrap/js/dist/tab';
import 'bootstrap/js/dist/dropdown';

export async function bootstrapClient() {
	$.holdReady(true);

	initJqueryPlugins();
	setupRegistry();
	setupTheme();

	const promises = [setupI18n()];
	const importedBundles = getImportedVar('bundles');
	if (Array.isArray(importedBundles)) {
		promises.push(bundles.all(importedBundles));
	}

	setupView();
	setupLocale();
	setupGlobalVars();
	setupClientListeners();
	setupRouter();
	setupWidgets();
	clientRegistry.setStartedUrl(`${window.location.pathname}${window.location.search}`);
	setupVue();

	await Promise.all(promises);

	clientRegistry.getClientNav().setup();
	importInstancesToClient(getImportedVar('registry').instanceExporter);

	$.holdReady(false);
}

const initJqueryPlugins = () => {
	serializeObjectPlugin($);
};

const getImportedVar = (name: string) => {
	const importVarName = '__clientExport';
	if (window[importVarName] && name in window[importVarName]) {
		return window[importVarName][name];
	}

	return false;
};

const setupRegistry = () => {
	const data = getImportedVar('registry') as unknown as IImportRegistry;
	if (data) {
		clientRegistry.import(data);
	}

	clientRegistry.setUniqueId(new UniqueId());
};

const setupI18n = async () => {
	const i18nKit = new I18nKit(clientRegistry.getConfig().i18nKit);
	clientRegistry.setI18nKit(i18nKit);
	clientRegistry.setI18n(i18nKit.createDefaultI18n());

	if (clientRegistry.getLang()) {
		return bundles.load('i18n');
	}
};

const setupView = () => {
	const data = getImportedVar('viewRenderer');
	const view = new ViewRenderer(data.config, data.globalViewData);

	clientRegistry.setView(view);

	view.loadBundle('basic');
};

const setupLocale = () => {
	clientRegistry.setLocale(
		new Locale(clientRegistry.getConfig().locale)
	);
};

const setupGlobalVars = () => {
	const varName = 'bb';
	if (typeof (window[varName]) === 'undefined' || !window[varName]) {
		window[varName] = {};
	}

	Object.assign(window[varName], {
		isReady: false,
		registry: clientRegistry,
		initWidget: initWidget,
		version: process.env.VERSION
	});

	$(() => {
		window[varName].isReady = true;

		if ('onReadyQueue' in window[varName] && Array.isArray(window[varName].onReadyQueue)) {
			for (const callback of window[varName].onReadyQueue) {
				callback.call(window, clientRegistry);
			}

			window[varName].onReadyQueue = [];
		}
	});
};

const setupRouter = () => {
	const router = new Router(clientRegistry.getConfig().router);

	router.import(getImportedVar('routes'));
	clientRegistry.setRouter(router);
};

const isEditMode = () => {
	const data = getImportedVar('viewRenderer');
	return (data.globalViewData != null) && (data.globalViewData.__editMode === true);
};

const setupWidgets = () => {
	if (isEditMode()) return;

	$(async () => {
		const inst = utils.createWidgetByName('system.loadingLine.@c');
		await inst.make();
		await inst.runLazyInit();
	});
};

const setupTheme = () => {
	clientRegistry.setTheme(new ClientTheme());
};

const setupVue = () => {
	Vue.use(vuePluginLocalMethods, {registry: clientRegistry});
	Vue.use(Vuex);
	Vue.use(vuePluginDomListeners);

	Vue.component('Widget', vueComponentWidget);
};