import path from 'path';
import _ from 'underscore';
import mkdirp from 'mkdirp';
import pathAlias from 'path-alias';
import childProcess from 'child_process';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';

const wrapperConfig = wrapperRegistry.getConfig();

export default class Compressor {
	constructor() {
	}

	compress(files, fileName) {
		if (!_.isArray(files)) {
			files = [files];
		}

		const filesTarStr = files.map(file => {
			return `-C ${path.dirname(file)} ${path.basename(file)}`;
		});

		const cmd = `tar -czf ${fileName} ${filesTarStr.join(' ')}`;

		return new Promise((resolve, reject) =>
			childProcess.exec(cmd, (err) => err ? reject(err) : resolve(fileName))
		);
	}

	async uncompress(file, dest = null) {
		const destination = await this.getUncompressFolder(file, dest);

		const cmd = `tar -xzf ${file} -C ${destination}`;
		await new Promise((resolve, reject) =>
			childProcess.exec(cmd, (err) => err ? reject(err) : resolve(destination))
		);
	}

	async getUncompressFolder(file, dest) {
		if (!dest) {
			dest = pathAlias.resolve('runtime/tarExtract');
		}

		const folder = path.resolve(dest, path.basename(file, '.tar.gz'));

		if (wrapperConfig.instanceManager.rmCmd) {
			await new Promise((resolve, reject) =>
				childProcess.exec(
					`${wrapperConfig.instanceManager.rmCmd} ${folder}`,
					(err) => err ? reject(err) : resolve())
			);
		}
		await new Promise((resolve, reject) =>
			mkdirp(folder, (err) => err ? reject(err) : resolve(folder))
		);
	}
}