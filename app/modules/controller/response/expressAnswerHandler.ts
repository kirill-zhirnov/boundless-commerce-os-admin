import {Request, Response} from 'express';
import Answer from './answer';

export default class ExpressAnswerHandler {
	constructor(
		protected request: Request,
		protected response: Response,
		protected answer: Answer
	) {
	}

	async process() {
		this.prepareAnswerVars();

		if (!this.answer.getPerformWithExpress())
			return;

		if (this.request.xhr) {
			await this.makeAjaxAnswer();
		} else {
			await this.makeBasicAnswer();
		}
	}

	protected async makeBasicAnswer() {
		if (this.answer.getStatus())
			this.response.status(this.answer.getStatus());

		switch (this.answer.getType()) {
			case 'html':
			case 'tpl':
			case 'widget':
			case 'layout': {
				const html = await this.answer.make();
				this.response.send(html);

				break;
			}

			case 'redirect':
				if (this.answer.getStatus()) {
					this.response.redirect(this.answer.getStatus(), this.answer.getData());
				} else {
					this.response.redirect(this.answer.getData());
				}
				break;

			case 'json':
			case 'modal':
				this.response.json(this.answer.getData());
				break;

			default:
				throw new Error(`Unknown response type '${this.answer.getType()}'`);
		}
	}

	protected async makeAjaxAnswer() {
		const json = await this.makeAjaxJson();

//			Due to the:
//			- https://trello.com/c/Ud1hNnXO/466-chrome-back-button
		this.response.set('Cache-Control', 'no-cache, no-store, must-revalidate');

		if (this.answer.getStatus())
			this.response.status(this.answer.getStatus());

		if (this.isCNavRequest())
			this.response.set('X-BB-Ver', process.env.VERSION);

		this.response.json(json);
	}

	protected async makeAjaxJson() {
		const jsonData = await this.prepareJson();
		const meta = this.makeAjaxMeta();

		const out: IAjaxResponse = {};
		if (Object.keys(meta).length > 0) {
			out.m = meta;
		}

		if (!this.answer.getAjaxMeta().preventDefault) {
			out.d = jsonData;
		}

		return out;
	}

	protected makeAjaxMeta(): {} {
		const meta = {};
		const ajaxMeta = this.answer.getAjaxMeta();

		for (const key of ['action', 'alerts', 'data', 'events']) {
			if (ajaxMeta[key] != null) {
				meta[key] = ajaxMeta[key];
			}
		}

		return meta;
	}

	protected async prepareJson() {
		let jsonData = {};
		switch (this.answer.getType()) {
			case 'redirect':
				this.answer
					.setMetaAction('redirect')
					.setMetaData(this.answer.getData())
					.setStatus(null)
				;
				break;

			case 'modalRedirect':
				this.answer
					.setMetaAction('modalRedirect')
					.setMetaData(this.answer.getData())
				;
				break;

			case 'json':
			case 'modal':
				jsonData = this.answer.getData();
				break;

			case 'html':
			case 'tpl':
			case 'widget':
			case 'layout':
				if (this.isCNavRequest()) {
					jsonData = this.answer.serialize();
				} else {
					jsonData = await this.answer.make();
				}
				break;

			default:
				throw new Error(`Unknown type for ajax answer: '${this.answer.getType()}'`);
		}

		return jsonData;
	}

	protected prepareAnswerVars() {
		const {page} = this.answer;

		if (this.isStrEmpty(page.title) && !this.isStrEmpty(page.header))
			page.title = page.header;

		if (!this.isStrEmpty(page.title) && this.isStrEmpty(page.header))
			page.header = page.title;

		//@ts-ignore
		this.answer.setPage(page);
	}

	protected isStrEmpty(str: string|null): boolean {
		return (str == null) || (str === '');
	}

	protected isCNavRequest(): boolean {
		return 'x-c-nav' in this.request.headers;
	}
}

export interface IAjaxResponse {
	//m - meta information
	m?: {[key: string]: any},
	//d - data
	d?: {[key: string]: any}|string
}