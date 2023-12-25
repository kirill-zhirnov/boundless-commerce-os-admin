import pathAlias from 'path-alias';
import fs from 'fs';
import {promisify} from 'util';
import juice from 'juice';
import {IViewPath, TViewPathType} from '../../@types/view';
import path from 'path';
import striptags from 'striptags';
const readFile = promisify(fs.readFile);

const scriptRegExp = /<script[^>]*>[^<]*<\/script>/ig;

export default abstract class BasicMail {
	protected cssFilePath: string;

	async loadCss(cssFilePath: string) {
		return await readFile(pathAlias.resolve(cssFilePath), 'utf-8');
	}

	async inlineCss(html: string, cssFilePath: string | null = this.cssFilePath): Promise<string> {
		const css = await this.loadCss(cssFilePath);
		html = juice(html, {extraCss: css});

		return html;
	}

	prepareHtml(html: string): string {
		return html.replace(scriptRegExp, '');
	}

	getViewPath(tpl): IViewPath {
		const filePath = this.getFileName();
		let relativePath = filePath.replace(`${pathAlias.getRoot()}/app/`, '');

		const fileName = path.basename(relativePath, path.extname(filePath));
		relativePath = path.dirname(relativePath);

		return {
			type: TViewPathType.absolute,
			package: null,
			path: `${relativePath}/views/${fileName}/${tpl}`
		};
	}

	createTextVersion(html) {
		return striptags(html);
	}

	/**
	 * Generic method, normally:
	 * getFileName() {return __filename;}
	 */
	abstract getFileName(): string;
}