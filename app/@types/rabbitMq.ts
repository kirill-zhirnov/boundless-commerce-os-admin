import {PublicationSession} from 'rascal';

export enum TQueueEventType {
	created = 'created',
	updated = 'updated',
	runCmd = 'runCmd',
	removed = 'removed',
	archived = 'archived',
	restored = 'restored',
	sorted = 'sorted',

	/**
	 * Generates Email and emits send-out-email event. Might be considered as outdated?
	 */
	sendMail = 'send-mail',

	/**
	 * Event processes RAW email. The event needs since some users want to use WEB-hook to
	 * send-out email (e.g. use postmark)
	 */
	sendOutEmail = 'send-out-email',

	importFinished = 'import-finished'
}

export interface IQueueEventData {
	[key: string]: any;
}

export interface IQueueModelChangedData {
	model: string;
	diff: {[key: string]: any};
	pkList: number[];
	userId?: number;
	notify?: {
		admin: boolean,
		client: boolean
	}
}

export interface IQueueModelRemovedData {
	model: string;
	pkList: number[];
	userId?: number;
}

export interface IQueueEventPublisher {
	publish: (type: TQueueEventType, data: IQueueEventData) => Promise<PublicationSession>;
	modelChanged: (data: IQueueModelChangedData) => Promise<PublicationSession>;
	modelCreated: (data: IQueueModelChangedData) => Promise<PublicationSession>;
	modelRemoved: (data: IQueueModelRemovedData) => Promise<PublicationSession>;
}

export interface IBaseQueueEventContent<T = IQueueEventData> {
	type: TQueueEventType;
	data: T
}

export interface IQueueEventContent<T = IQueueEventData> extends IBaseQueueEventContent<T> {
	instanceId: number;
}

export interface ISendOutEmailHandlerData {
	alias: string,
	data: Record<string, any>,
	subject: string|null,
	html: {
		content: string,
		full: string
	},
	recipients: string[]
}