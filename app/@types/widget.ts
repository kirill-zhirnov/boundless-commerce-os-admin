import {ViewOptions} from 'backbone';
import {IFrontController} from './frontController';

export interface IWidgetOptions extends ViewOptions {
	clientExport?: boolean,
	package?: string,
	frontController?: IFrontController,
	data?: {
		[key: string]: any
	},
	incomeAttrs?: {
		[key: string]: any
	}
}