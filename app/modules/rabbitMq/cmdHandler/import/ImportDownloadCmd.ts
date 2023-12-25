import ImportBaseCmd from './ImportBaseCmd';
import {wrapperRegistry} from '../../../registry/server/classes/wrapper';
import {IImportConstructorArgs} from '../../../../@types/cmdHandler';

export default class ImportDownloadCmd extends ImportBaseCmd {
	constructor(...props: IImportConstructorArgs) {
		super(...props, wrapperRegistry.getConfig().instanceManager.import.productFileDownloadArgs);
	}
}
