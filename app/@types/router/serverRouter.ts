import {IBasicRouter} from './router';

export interface IServerRouter extends IBasicRouter {
	parse: (path: string, method?: string|null) => IParsedRoute|false;
	getClientConfig: () => {importUrl: string, baseUrl: string};
	exportToClient: () => {routes: {[key: string]: any}, paths: {[key: string]: any}, aliases: {[key: string]: any}};
}

export interface IParsedRoute {
	package: string;
	pathPrefix: string;
	controller: string;
	action: string;
	method: string;
	originalPath: string;
	params: null|{};
}