import Answer from '../../controller/response/answer';
import _ from 'underscore';
import FrontController from '../front';
import InstanceRegistry from '../../registry/server/classes/instance';
import {IServerClientRegistry} from '../../../@types/registry/serverClientRegistry';

export default class BasicPlugin {
	/**
	 * @param {FrontController} frontController
	 */
	constructor(frontController) {
		this.frontController = frontController;
	}

	getFrontController() {
		return this.frontController;
	}

	/**
	 * @returns {IServerClientRegistry}
	 */
	getClientRegistry() {
		return this.getFrontController().getClientRegistry();
	}

	makeAnswer() {
		return new Answer();
	}

	/**
	 * @param url
	 * @returns {Answer}
	 */
	makeRedirect(url) {
		const answer = this.makeAnswer();
		answer.redirect(url);

		return answer;
	}

	/**
	 * @returns {InstanceRegistry}
	 */
	getInstanceRegistry() {
		return this.frontController.getInstanceRegistry();
	}

	isAnswer(data) {
		if (data && _.isObject(data) && data instanceof Answer) {
			return true;
		}

		return false;
	}
}