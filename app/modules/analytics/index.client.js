// @ts-nocheck
import $ from 'jquery';

const ya = {
	inited: false,
	yaId: null
};


export function initMetrika() {
	const {analytics} = require('../registry/client/client.client').clientRegistry.getConfig();
	if (!analytics.metrikaId) {
		return;
	}

	(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments);};
		m[i].l=1*new Date();
		for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
		k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);})
	// eslint-disable-next-line
	(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

	window.ym(analytics.metrikaId, 'init', {
		clickmap: true,
		trackLinks: true,
		accurateTrackBounce: true,
		webvisor: true,
	});

	Object.assign(ya, {
		inited: true,
		yaId: analytics.metrikaId
	});
}

export function hit(url, response) {
	const {page} = response;

	if (ya.inited) {
		window.ym(ya.yaId, 'hit', url, {title: page.title});
	}

	$(document).trigger('hit.analytics', {
		url,
		response
	});
}

export function hitModal(url, title) {
	if (title === null) {
		title = '';
	}
	if (ya.inited) {
		window.ym(ya.yaId, 'hit', `/modal${url}`, {title: `Modal: ${title}`});
	}
}