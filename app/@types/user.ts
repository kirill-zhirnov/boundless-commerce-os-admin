import {IServerClientRegistry} from './registry/serverClientRegistry';
import {IInstanceRegistry} from './registry/instanceRegistry';

export interface IUser {
	getSetting: (key: string, defaultValue?: any) => any;
	setSetting: (key: string, val: any) => Promise<any>;
	rmSetting: (key: string) => Promise<any>;

	getRoles: () => string[];
	isGuest: () => boolean;
	isAdmin: () => boolean;
	isClient: () => boolean;
	isGuestBuyer: () => boolean;
	isOwner: () => boolean;
	hasManagersRole: () => boolean;

	getId: () => number;

	setClientRegistry: (registry: IServerClientRegistry) => this;
	setInstanceRegistry: (instanceRegistry: IInstanceRegistry) => this;
	getClientRegistry: () => IServerClientRegistry;

	makeGuestVisitor: (authUser?: boolean) => Promise<number>;
	makeGuestBuyer: () => Promise<number>;
	makeUnregisteredCustomerByEmail: (email: string) => Promise<any>;

	authById: (personId: number, setCookie?: boolean) => Promise<any>;
	getHomeRoute: () => string;
	getUrlAfterSignIn: () => any[];

	getPublicStates: () => {[key: string]: any};
	reLoadStates: () => Promise<any>;

	setBlockedRoute: (url: string) => this;
	getBlockedRoute: () => string|null;

	on: (eventName: string, callback: () => void) => this;

	getState: (key: string, defVal?: any) => any;
	setState: (key: string, val: any) => this;
	logout: () => void;
}

export interface IGlobalViewUser {
	roles: string[];
	isAdmin: boolean;
	email: string|null;
}