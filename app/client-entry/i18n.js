import {clientRegistry} from '../modules/registry/client/client.client';

const i18nKit = clientRegistry.getI18nKit();

// const {code} = clientRegistry.getLang();
// import ruLocale from '../i18n/ru/messages.json';
// i18nKit.setCachedData(code, ruLocale);
// clientRegistry.setI18n(i18nKit.createI18nCached(code));

clientRegistry.setI18n(i18nKit.createDefaultI18n());
