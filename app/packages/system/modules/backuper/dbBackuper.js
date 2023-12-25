import childProcess from 'child_process';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';

const wrapperConfig = wrapperRegistry.getConfig();

export default class DbBackuper {
	constructor() {
		this.dump = null;
	}

	makeDump(dbName, path) {
		this.dump = `${path}/${dbName}-${Date.now()}.sql`;
		const cmd = [wrapperConfig.backup.cmd.pgDump];
		cmd.push(`-U ${wrapperConfig.db.user}`);
		cmd.push(`-h ${wrapperConfig.db.config.host}`);
		cmd.push('--no-owner --no-privileges');
		cmd.push(`${dbName} > ${this.dump}`);

		return new Promise((resolve, reject) =>
			childProcess.exec(cmd.join(' '), (err) => err ? reject(err) : resolve(this.dump))
		);
	}

	removeDump() {
		const cmd = `${wrapperConfig.instanceManager.rmCmd} ${this.dump}`;

		return new Promise((resolve, reject) =>
			childProcess.exec(cmd, (err, data) => err ? reject(err) : resolve(data))
		);
	}

	getDumpPath() {
		return this.dump;
	}
}