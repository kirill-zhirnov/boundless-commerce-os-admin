import {IView} from './view';
import {IServerClientRegistry} from './registry/serverClientRegistry';
import {ICollectionConstructor, ICollectionOptions} from './backbone';
import {Collection, Model} from 'backbone';
import Answer from '../modules/controller/response/answer';
import {IInstanceRegistry} from './registry/instanceRegistry';
import {Request} from 'express';

export interface IFrontController {
	getView: () => IView;
	getClientRegistry: () => IServerClientRegistry;
	makeBbCollection: (collection: string|ICollectionConstructor, models?: Model[] | Array<Record<string, any>>, options?: ICollectionOptions) => Collection;
	runInternal: (path: string, method?: string, params?: {[key: string]: any}, bodyParams?: {[key: string]: any}) => Promise<Answer>;
	getInstanceRegistry: () => IInstanceRegistry;
	getRequest: () => Request|undefined;
}