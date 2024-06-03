import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';
import pathAlias from 'path-alias';
import {IViewData, TViewPathType} from '../../@types/view';
import {IFrontController} from '../../@types/frontController';
import FrontControllerMock from '../controller/front/mock';
import InstanceSES from './transport/awsSes';
import * as thumbnailUrl from '../../packages/cms/modules/thumbnail/url';
import BasicMail from './basicMail';
import {IMailTransport} from '../../@types/mail';
import {IEmailTplModel} from '../../packages/system/models/emailTpl';
import {compile} from '../../packages/system/modules/mustacheCompiler';
import {IMailSettings} from '../../@types/settings';
import {ISendOutEmailHandlerData, TQueueEventType} from '../../@types/rabbitMq';

export default abstract class BasicInstanceMail extends BasicMail {
	protected frontController: IFrontController;
	protected mailSettings: IMailSettings | null = null;

	constructor(protected instanceRegistry: IInstanceRegistry) {
		super();

		this.cssFilePath = pathAlias.resolve('public/css/email.css');
	}

	async renderPartial(tpl: string, data: {[key: string]: any} = {}): Promise<string> {
		data = await this.prepareTplData(data);

		const viewPath = this.getViewPath(tpl);
		let html = await (await this.getFrontController())
			.getView()
			.localRender(viewPath.type, viewPath.path, data, viewPath.package)
		;

		html = this.prepareHtml(html);

		return html;
	}

	async renderDBPartial(alias: string, data: IViewData = {}): Promise<{subject: null|string, body: string}> {
		const tpl = (await this.instanceRegistry.getDb().model('emailTpl').findOne({
			where: {alias}
		})) as IEmailTplModel|null;

		if (!tpl) {
			throw new Error(`Template "${alias}" is not found. Cant process`);
		}

		let body = compile(tpl.template, data);
		body = this.prepareHtml(body);

		const subject = tpl.subject !== null ? compile(tpl.subject, data) : null;

		return {subject, body};
	}

	async render(tpl: string, data: IViewData = {}, layout: string = 'layouts/email', layoutData: IViewData = {}, inlineCss: boolean = true): Promise<{content: string, full: string}> {
		const content = await this.renderPartial(tpl, data);

		const out = await this.renderLayout(content, layout, layoutData, inlineCss);

		return out;
	}

	async renderDbTemplate({alias, data = {}, layout = 'layouts/email', layoutData = {}, inlineCss = true}: {
		alias: string,
		data?: IViewData,
		layout?: string,
		layoutData?: IViewData,
		inlineCss?: boolean
	}): Promise<{html: {content: string, full: string}, subject: string|null}> {
		const {body, subject} = await this.renderDBPartial(alias, data);

		const html = await this.renderLayout(body, layout, layoutData, inlineCss);

		return {html, subject};
	}

	async renderLayout(content: string, layout: string = 'layouts/email', layoutData: IViewData = {}, inlineCss: boolean = true): Promise<{content: string, full: string}> {
		const frontController = await this.getFrontController();
		const view = frontController.getView();

		const {logo, signature} = await this.getMailTemplate();
		const logoPath = thumbnailUrl.getAttrs(this.instanceRegistry, {
			path: logo || '',
			height: 400,
			width: 400
		}, 'scaled', 'm').src;

		Object.assign(layoutData, {
			content,
			logo: logo ? logoPath : null,
			signature
		});
		layoutData = await this.prepareTplData(layoutData);
		const layoutHtml = await view.localRender(TViewPathType.file, layout, layoutData);

		const explodedLayout = layout.split('/');
		explodedLayout.splice(0, 1);

		let wrapperTplData: IViewData = {
			attrs: {
				id: `layout-${explodedLayout.join('-')}`,
				class: 'email',
				lang: frontController.getClientRegistry().getLang().code
			},
			content: layoutHtml
		};
		wrapperTplData = await this.prepareTplData(wrapperTplData);

		let fullHtml = await view.localRender(TViewPathType.file, 'wrappers/email', wrapperTplData);
		fullHtml = this.prepareHtml(fullHtml);

		if (inlineCss) {
			fullHtml = await this.inlineCss(fullHtml);
		}

		return {
			content,
			full: fullHtml
		};
	}

	async prepareTplData(data: IViewData): Promise<IViewData> {
		if (this.frontController) {
			data.frontController = await this.getFrontController();
		}

		return data;
	}

	async getMail(): Promise<IMailTransport> {
		const {from, replyTo} = await this.getMailSettings();
		const mail = new InstanceSES();

		mail.setSource(from);
		mail.addReplyTo(replyTo);

		return mail;
	}

	async getMailSettings(): Promise<IMailSettings> {
		return this.mailSettings || await this.instanceRegistry.getSettings().get('mail', 'settings') as IMailSettings;
	}

	async getMailTemplate(): Promise<IMailTemplate> {
		return await this.instanceRegistry.getSettings().get('mail', 'template');
	}

	async getFrontController(): Promise<IFrontController> {
		if (!this.frontController) {
			const fc = new FrontControllerMock(this.instanceRegistry);
			await fc.setup();

			this.frontController = fc;
		}

		return this.frontController;
	}

	setFrontController(frontController: IFrontController) {
		this.frontController = frontController;
		return this;
	}

	getInstanceRegistry() {
		return this.instanceRegistry;
	}

	async emitMailEvent(mail: ISendOutEmailHandlerData) {
		await this.instanceRegistry.getEventPublisher()
			.publish(TQueueEventType.sendOutEmail, mail)
		;
	}
}


export interface IMailTemplate {
	logo: string | null;
	signature: string;
}