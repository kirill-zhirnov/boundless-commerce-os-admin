import childProcess from 'child_process';
import pathAlias from 'path-alias';
import {ICmdHandler} from '../../../../@types/cmdHandler';

export default abstract class ImportBaseCmd implements ICmdHandler {
	private readonly cmd = pathAlias.resolve('node_modules/.bin/ts-node');
	private readonly flagArgs: string[] = [];

	protected constructor(
		instanceId: number,
		importId: number,
		private readonly cmdOptions: childProcess.SpawnOptions,
		private readonly args: string[] = []
	) {
		this.flagArgs = [
			`--instanceId=${instanceId}`,
			`--importId=${importId}`
		];
	}

	public async run() {
		const args = [...this.args, ...this.flagArgs];
		console.log(`Running script ${this.constructor.name} with1 args ${args}, cmd: ${this.cmd}`);
		const spawn = childProcess.spawn(this.cmd, args, this.cmdOptions);
		spawn.unref();
	}
}
