import InstanceRegistry from '../modules/registry/server/classes/instance';
// import {TInstanceSession} from '../modules/controller/front';
import {IServerClientRegistry} from './registry/serverClientRegistry';

export interface IEnv {
	instanceRegistry: InstanceRegistry;
	clientRegistry: IServerClientRegistry;
	session: {}
	cookies: {}
}