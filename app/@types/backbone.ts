import {Collection, Model} from 'backbone';
import {IFrontController} from './frontController';

export interface ICollectionConstructor {
	new (models?: Model[] | Array<Record<string, any>>, options?: ICollectionOptions): Collection
}

export interface ICollectionOptions {
	frontController?: IFrontController;
}