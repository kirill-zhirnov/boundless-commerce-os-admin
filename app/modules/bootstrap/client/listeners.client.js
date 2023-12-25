import modalKit from '../../modal/kit.client';
import utils from '../../utils/common.client';
// import ajax from '../../ajax/kit.client';
import {clientRegistry} from '../../registry/client/client.client';
import $ from 'jquery';

// const basket = require('../../../packages/orders/modules/basket.client');
// const adminBasket = pathAlias('@p-orders/modules/adminBasket.@c');
// const analytics = require('../../analytics/index.client');

export function setupClientListeners() {
	$(document).on('submit', 'form[data-form]', function(e) {
		const $form = $(this);

		const widget = utils.constructFormByEl($form, false);
		if (widget) {
			widget.onSubmit(e);
		}
	});

	$(document).on('submit', 'form[data-get-form]', function(e) {
		e.preventDefault();

		const $form = $(e.currentTarget);

		const url = utils.concatUrl($form.attr('action'), $form.serialize());

		clientRegistry.getClientNav().url(url);
	});

	$(document).on('click', 'a[data-modal],button[data-modal],input[data-modal]', function(e) {
		e.preventDefault();

		const $el = $(this);
		modalKit.createRemote($el.attr('href'));
	});

	$(document).on('show.bs.tab', function(e) {
		const $a = $(e.target);

		if ($a.parent().hasClass('disabled')) {
			e.preventDefault();
		}
	});

	$(document).on('shown.bs.tab', 'li[data-tab-url]', function(e) {
		const $button = $(e.target);
		const $li = $button.parent();
		const $div = $li.parents('ul.nav-tabs:eq(0)').next('.tab-content').find(`${$button.data('bs-target')}`);
		const content = $div.html().replace(/\s/g, '');

		if ((content.length !== 0) && ($li.data('tab-reload') !== 1)) {
			return;
		}

		const url = $li.data('tab-url');
		if (url) {
			const clientRequest = clientRegistry.getClientNav().makeRequest();
			clientRequest.makeRequest(url)
			.then(() => clientRequest.getAnswer().processBody())
			.then(function(html) {
				$div.html(html);
				$button.trigger('contentLoaded.tab');
			});
		}
	});

	// $(document).on('click', 'a[data-to-basket]', function(e) {
	// 	e.preventDefault();
	//
	// 	analytics.emitAction('buyBtnClicked');
	// 	return basket.add($(this).data('to-basket'));
	// });

	// $(document).on('click', 'a[data-admin-basket]', function(e) {
	// 	e.preventDefault();
	//
	// 	return adminBasket.addProduct($(this).data('admin-basket'));
	// });
}