import Answer from '../modules/controller/response/answer';

export interface IClientNavigation {
	setup: () => void;
	reload: (option?: {}) => void;
	url: (url: string, pushState?: boolean) => Promise<boolean>;
	makeRequest: () => INavigationRequest;
}

export interface INavigationRequest {
	about: () => INavigationRequest;
	getAnswer: () => Answer;
	makeRequest: (url: string) => Promise<void>;
}