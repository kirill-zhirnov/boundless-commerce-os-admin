import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';
import pathAlias from 'path-alias';
import {IViewData, TViewPathType} from '../../@types/view';
import {IFrontController} from '../../@types/frontController';
import FrontControllerMock from '../controller/front/mock';
import InstanceSES from './transport/awsSes';
import * as thumbnailUrl from '../../packages/cms/modules/thumbnail/url';
import BasicMail from './basicMail';

export default abstract class BasicInstanceMail extends BasicMail{
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

	async render(tpl: string, data: IViewData = {}, layout: string = 'layouts/email', layoutData: IViewData = {}, inlineCss: boolean = true): Promise<{content: string, full: string}> {
		const content = await this.renderPartial(tpl, data);

		const out = await this.renderLayout(content, layout, layoutData, inlineCss);

		return out;
	}

	async renderLayout(content: string, layout: string = 'layouts/email', layoutData: IViewData = {}, inlineCss: boolean = true) {
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

	async getMail(): Promise<InstanceSES> {
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
			//@ts-ignore
			this.frontController = new FrontControllerMock(this.instanceRegistry);
			//@ts-ignore
			await this.frontController.setup();
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
}

export interface IMailSettings {
	from: string;
	replyTo: string | string[];
}

export interface IMailTemplate {
	logo: string | null;
	signature: string;
}