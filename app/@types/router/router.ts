export interface IBasicRouter {
	url: (urlPath: string, params?: {[key: string]: any}, isAbsolute?: boolean) => string;

	createGetStr: (params: {[key: string]: any}, skipRoot?: string[], prefix?: string) => string;
}