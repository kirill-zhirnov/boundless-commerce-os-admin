export interface IView {
	localRender: (type: string, file: string, data?: {[key: string]: any}, packageName?: string) => Promise<string>;
	getGlobalViewData: (key: string, defaultVal?: any) => any;
}

export enum TViewPathType {
	absolute = 'absolute',
	file = 'file'
}

export interface IViewPath {
	type: TViewPathType,
	package: string|null,
	path: string
}

export interface IViewData {
	[key: string]: any
}