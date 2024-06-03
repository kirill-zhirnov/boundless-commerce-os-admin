import {IMailSettings} from '../../@types/settings';
import BasicMail from './basicMail';
import {IView, IViewData, TViewPathType} from '../../@types/view';
import BasicRenderer from '../viewRenderer/renderer/basic';
import pathAlias from 'path-alias';
import {wrapperRegistry} from '../registry/server/classes/wrapper';
import InstanceSES from './transport/awsSes';

export default abstract class BasicGeneralMail extends BasicMail {
	protected mailSettings: IMailSettings | null = null;
	protected view: IView|null = null;

	constructor() {
		super();

		this.cssFilePath = pathAlias.resolve('public/css/email.css');
	}

	async renderPartial(tpl: string, data: {[key: string]: any} = {}): Promise<string> {
		const viewPath = this.getViewPath(tpl);
		let html = await this.getView()
			.localRender(viewPath.type, viewPath.path, data, viewPath.package)
		;

		html = this.prepareHtml(html);

		return html;
	}

	getView(): IView {
		if (!this.view) {
			this.view = new BasicRenderer({useCache: false});

			//@ts-ignore
			this.view.setCache(wrapperRegistry.getGeneralCache());
		}

		return this.view;
	}

	async renderLayout(content: string, layout: string = 'layouts/email/system', layoutData: IViewData = {}, inlineCss: boolean = true) {
		Object.assign(layoutData, {
			content
		});

		const layoutHtml = await this.getView().localRender(TViewPathType.file, layout, layoutData);

		const explodedLayout = layout.split('/');
		explodedLayout.splice(0, 1);

		const wrapperTplData: IViewData = {
			attrs: {
				id: `layout-${explodedLayout.join('-')}`,
				class: 'email',
				lang: 'en'
			},
			content: layoutHtml
		};

		let fullHtml = await this.getView().localRender(TViewPathType.file, 'wrappers/email', wrapperTplData);
		fullHtml = this.prepareHtml(fullHtml);

		if (inlineCss) {
			fullHtml = await this.inlineCss(fullHtml);
		}

		return {
			content,
			full: fullHtml
		};
	}

	async render(tpl: string, data: IViewData = {}, layout: string = 'layouts/email/system', layoutData: IViewData = {}, inlineCss: boolean = true): Promise<{content: string, full: string}> {
		const content = await this.renderPartial(tpl, data);
		const out = await this.renderLayout(content, layout, layoutData, inlineCss);

		return out;
	}

	async getMail(): Promise<InstanceSES> {
		const mail = new InstanceSES();
		mail.setSource('info@boundless-commerce.com');

		return mail;
	}
}