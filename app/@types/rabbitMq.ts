import {PublicationSession} from 'rascal';

export enum TQueueEventType {
	created = 'created',
	updated = 'updated',
	runCmd = 'runCmd',
	removed = 'removed',
	archived = 'archived',
	restored = 'restored',
	sorted = 'sorted',

	sendMail = 'send-mail',
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
