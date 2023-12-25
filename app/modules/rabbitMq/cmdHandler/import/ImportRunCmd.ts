import ImportBaseCmd from './ImportBaseCmd';
import {wrapperRegistry} from '../../../registry/server/classes/wrapper';
import {IImportConstructorArgs} from '../../../../@types/cmdHandler';

export default class ImportRunCmd extends ImportBaseCmd {
	constructor(...props: IImportConstructorArgs) {
		super(...props, wrapperRegistry.getConfig().instanceManager.import.productRunArgs);
	}
}
