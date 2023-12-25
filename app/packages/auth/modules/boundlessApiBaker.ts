import {IInstanceRegistry} from '../../../@types/registry/instanceRegistry';
import {IApiTokenModelStatic} from '../models/apiToken';
import {BoundlessClient} from 'boundless-api-client';
import {generateBoundlessToken} from 'boundless-api-client/token';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';

export const systemTokenName = '__boundless-system';

export const makeBoundlessSystemApi = async (instanceRegistry: IInstanceRegistry): Promise<BoundlessClient> => {
	const token = await (instanceRegistry.getDb().model('apiToken') as IApiTokenModelStatic)
		.findOrCreateTokenByName(systemTokenName, true, true)
	;

	const permanentToken = generateBoundlessToken(token.client_id, token.secret, instanceRegistry.getInstanceInfo().instance_id);
	const apiClient = new BoundlessClient(permanentToken);
	apiClient.setInstanceId(instanceRegistry.getInstanceInfo().instance_id);

	const {boundlessApiBaseUrl} = wrapperRegistry.getConfig();
	if (boundlessApiBaseUrl) {
		apiClient.setBaseUrl(boundlessApiBaseUrl);
	}

	return apiClient;
};