import _ from 'underscore';
import BasicRouter from '../router/basic.client';
import {clientRegistry} from '../registry/client/client.client';
export function getImgCloudUrl(localPath: string, maxSize: number, options: IOptions = {}): string {
	if (process.env.__IS_SERVER__) {
		throw new Error('For server-side execution getImgCloudServer');
	}

	_.defaults(options, {
		mode: TResizeMode.scale,
		q: TResizeQuality.normal,
	});
	options['max-size'] = maxSize;

	const {clientRegistry} = require('../registry/client/client.client');

	const mediaServerUrl: string = clientRegistry.getConfig().s3Storage.mediaServer;
	const folderPrefix: null|string = clientRegistry.getConfig().s3Storage.folderPrefix;
	const instanceId: number = clientRegistry.getInstanceInfo().instance_id;
	const router: BasicRouter = clientRegistry.getRouter();

	const subPath = ['thumb'];
	if (folderPrefix) {
		subPath.push(folderPrefix);
	}
	subPath.push(`i${instanceId}`);
	subPath.push(localPath);

	return `${mediaServerUrl}/${subPath.join('/')}?${router.createGetStr(options)}`;
}

export interface IOptions {
	mode?: TResizeMode,
	q?: TResizeQuality,
	ratio?: TResizeRatio,
	pad?: boolean;
	bg?: string;
	grayscale?: boolean;
	blur?: number;
	'max-size'?: number;
}

export enum TResizeMode {
	scale = 'scale'
}

export enum TResizeQuality {
	low = 'low',
	normal = 'normal',
	high = 'high'
}

export enum TResizeRatio {
	'1-1' = '1-1',
	'2-3' = '2-3',
	'3-2' = '3-2',
	'4-5' = '4-5',
	'5-4' = '5-4',
	'3-4' = '3-4',
	'4-3' = '4-3',
	'16-9' = '16-9',
	'9-16' = '9-16',
}