import {IQueueEventContent} from '../../../@types/rabbitMq';
import {
	CmdOptions,
	ICmdHandler,
	ICmdParameters,
	ICmdParametersDefined,
	ImportCmdActions
} from '../../../@types/cmdHandler';
import ImportRunCmd from './import/ImportRunCmd';
import ImportDownloadCmd from './import/ImportDownloadCmd';

export default class CmdHandler {
	private readonly handler: ICmdHandler = null;

	constructor(private readonly event: IQueueEventContent<ICmdParameters>) {
		if (event.data.cmd === CmdOptions.Import) {
			const data: ICmdParametersDefined<CmdOptions.Import> = event.data;
			this.handler = data.action === ImportCmdActions.Run
				? new ImportRunCmd(event.instanceId, data.import_id, data.options)
				: new ImportDownloadCmd(event.instanceId, data.import_id, data.options);
		}
	}

	public async handle() {
		await this.handler.run();
	}
}
