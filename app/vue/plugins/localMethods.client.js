import gHtml from '../../modules/gHtml/index.client';
import bundles from '../../modules/utils/bundles.client';
import bs from '../../modules/gHtml/bs.client';
import utils from '../../modules/utils/common.client';
import SimpleForm from '../../modules/widget/simpleForm.client';
import SimpleFormGroup from '../../modules/widget/simpleFormGroup.client';
import ajax from '../../modules/ajax/kit.client';
import modalKit from '../../modules/modal/kit.client';
import $ from 'jquery';

export default {
	install: (Vue, options) => {
		Vue.regComponents = function(components) {
			for (let key in components) {
				Vue.component(key, components[key]);
			}
		};

		Object.assign(Vue.prototype, {
			getRegistry() {
				return options.registry;
			},

			isEditMode() {
				return this.getRegistry().getView().getGlobalViewData('__editMode', false);
			},

			getThemeId() {
				return this.getRegistry().getTheme().config.id;
			},

			getLayoutName() {
				return $('#layout').data('layout');
			},

			getModalKit() {
				return modalKit;
			}
		});

		// Vue.prototype.getRegistry = function() {
		// 	return options.registry;
		// }

		Vue.prototype.getI18n = function() {
			return options.registry.getI18n();
		};

		Vue.prototype.__ = function() {
			let i18n = this.getI18n();

			return i18n.__.apply(i18n, arguments);
		};

		Vue.prototype.p__ = function() {
			let i18n = this.getI18n();

			return i18n.p__.apply(i18n, arguments);
		};

		Vue.prototype.getLocale = function() {
			return options.registry.getLocale();
		};

		Vue.prototype.formatMoney = function() {
			let locale = this.getLocale();

			return locale.formatMoney.apply(locale, arguments);
		};

		Vue.prototype.url = function() {
			let router = options.registry.getRouter();

			return options.registry.getRouter().url.apply(router, arguments);
		};

		Vue.prototype.gHtml = function() {
			return gHtml;
		};

		Vue.prototype.bs = function() {
			return bs;
		};

		Vue.prototype.getUtils = function() {
			return utils;
		};

		Vue.prototype.$form = function(el) {
			return new SimpleForm({el: el});
		};

		Vue.prototype.$formGroup = function(el) {
			return new SimpleFormGroup({el: el});
		};

		Vue.prototype.$widget = function(el, name, options) {
			options = JSON.parse(JSON.stringify(options));
			options.el = el;

			let instance = utils.createWidgetByName(name, options);
			instance.make()
				.then((resHtml) => {
					$(el).html(resHtml);
				});

			return instance;
		};

		Vue.prototype.$ajax = ajax;

		Vue.prototype.$clear = function(obj) {
			return JSON.parse(JSON.stringify(obj));
		};

		Vue.prototype.$bundle = function(name) {
			if (Array.isArray(name))
				return bundles.all(name);

			return bundles.load(name);
		};
	}
};