import ViewRenderer from '../modules/viewRenderer/viewRenderer.client';
import RequestView from '../modules/viewRenderer/renderer/request';
import {IClientRegistry} from './registry/clientRegistry';
import {IServerClientRegistry} from './registry/serverClientRegistry';

export interface IRequestEnvironment {
	localRender: (type: string, file: string, data?: {[key: string]: any}, packageName?: string|null) => Promise<string>;
	widget: (name: string, data?: {[key: string]: any}) => Promise<string>;
	getView: () => ViewRenderer|RequestView;
	getClientRegistry: () => IClientRegistry|IServerClientRegistry;
}