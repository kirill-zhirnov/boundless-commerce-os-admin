import ajax from '../ajax/kit.client';
import {clientRegistry} from '../registry/client/client.client';
import {hitModal} from '../analytics/index.client';
import Backbone from 'backbone';
import $ from 'jquery';
import Modal from './modal.client';

class ModalKit {
	constructor() {
		this.active = null;

		if (!process.env.__IS_SERVER__) {
			this.setupListeners();
		}
	}

	async createRemote(url) {
		const data = await ajax.get(url);

		if (typeof (data.settings) === 'undefined') {
			if (process.env.NODE_ENV === 'development') {
				console.log('Skipping opening modal since data.settings is undefined.');
			}

			return;
		}

		const html = await clientRegistry.getView().localRender(
			data.tpl.type,
			data.tpl.path,
			data.data,
			data.tpl.package
		);

		data.settings.setHtml = [html];

		let title = null;
		const popup = this.create(data.path);
		for (let method in data.settings) {
			let args = data.settings[method];
			if (!Array.isArray(args)) {
				args = [args];
			}

			popup[method].apply(popup, args);

			if (method === 'setTitle') {
				title = args[0];
			}
		}

		popup.open();
		hitModal(url, title);
	}

	/**
	 * @param {string} constructorPath
	 * @param options
	 * @returns {Modal}
	 */
	create(constructorPath, options = {}) {
		let ModalConstructor;

		switch (constructorPath) {
			case '@p-inventory/modals/chooseProductVariant.@c':
				ModalConstructor = require('../../packages/inventory/modals/chooseProductVariant.client');
				break;
			// case '@p-orders/modals/choosePickupPoint.@c':
			// 	ModalConstructor = require('../../packages/orders/modals/choosePickupPoint.client');
			// 	break;
			//
			// case '@p-theme/modals/insertNewBlock.@c':
			// 	ModalConstructor = require('../../packages/theme/modals/insertNewBlock.client');
			// 	break;
			default:
				ModalConstructor = require('./modal.client');
				break;
		}

		//@ts-ignore
		if (ModalConstructor.default) {
			//@ts-ignore
			ModalConstructor = ModalConstructor.default;
		}

		//@ts-ignore
		const modal = new ModalConstructor(options);

		this.listenModal(modal);

		return modal;
	}

	listenModal(modal) {
		//@ts-ignore
		this.listenTo(modal, 'modal:beforeOpen', function (modal) {
			if (this.active) {
				//@ts-ignore
				this.rmActive();
			}

			this.active = modal;
		});
	}

	stopListeningModal(modal) {
		//@ts-ignore
		this.stopListening(modal);
	}

	rmActive() {
		if (this.active.getIsOpened()) {
			this.active.close();
		}

		this.active.remove();
		//@ts-ignore
		this.stopListening(this.active);
		this.active = null;
	}

	setupListeners() {
		return $(document).on('beforeRequest.cNav', () => {
			if (this.active && this.active.getIsOpened()) {
				this.active.close();
			}
		});
	}

	getActive() {
		return this.active;
	}
}

Object.assign(ModalKit.prototype, Backbone.Events);

const modalKit = new ModalKit;
export default modalKit;