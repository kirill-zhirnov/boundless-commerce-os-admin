import {wrapperRegistry} from '../registry/server/classes/wrapper';
import {IOptions, TResizeMode, TResizeQuality} from './cloudUrl';
import _ from 'underscore';
import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';
import {IServerRouter} from '../../@types/router/serverRouter';

export function getImgCloudServer(instanceRegistry: IInstanceRegistry, localPath: string, maxSize: number, options: IOptions = {}): string {
	_.defaults(options, {
		mode: TResizeMode.scale,
		q: TResizeQuality.normal,
	});
	options['max-size'] = maxSize;

	const wrapperConfig = wrapperRegistry.getConfig();
	const mediaServerUrl: string = wrapperConfig.instanceS3Storage.mediaServer;
	const folderPrefix: null|string = wrapperConfig.instanceS3Storage.folderPrefix;
	const instanceId: number = instanceRegistry.getInstanceInfo().instance_id;
	const router: IServerRouter = instanceRegistry.getRouter();

	const subPath = ['thumb'];
	if (folderPrefix) {
		subPath.push(folderPrefix);
	}
	subPath.push(`i${instanceId}`);
	subPath.push(localPath);

	return `${mediaServerUrl}/${subPath.join('/')}?${router.createGetStr(options)}`;
}