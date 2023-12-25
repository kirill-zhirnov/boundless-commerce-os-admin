import fs from 'fs';
import path from 'path';
import md5 from 'md5';
import mkdirp from 'mkdirp';

export class RandomPath {
	constructor(rootPath, ext, level = 2) {
		this.rootPath = rootPath;
		this.ext = ext;
		this.level = level;
	}

	createPath() {
		const ext = this.ext ? `.${this.ext}` : '';

		while (true) {
			let randomStr = md5(Math.random());
			let dirPrefix = '';

			if (this.level) {
				for (let i = 0, end = this.level - 1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
					dirPrefix += `${randomStr.substr(0, 2)}/`;
					randomStr = randomStr.substr(2);
				}
			}

			const localPath = `${dirPrefix}${randomStr}${ext}`;
			const absolutePath = `${this.rootPath}/${localPath}`;

			try {
				fs.statSync(absolutePath);
			} catch (e) {
//				file does not exist
				if (this.isNotExistsError(e)) {
					this.validateDirExists(`${this.rootPath}/${dirPrefix}`);

					return localPath;
				} else {
					throw e;
				}
			}

//			file exists - continue
			continue;
		}
	}

	validateDirExists(dirPath) {
		try {
			return fs.statSync(dirPath);
		} catch (e) {
			if (this.isNotExistsError(e)) {
				return mkdirp.sync(dirPath);
			}
		}
	}

	isNotExistsError(e) {
		return ((e.code === 'ENOENT') && (e.errno === -2));
	}
}

export function getByFileName(rootPath, fileName, level = 2) {
	const ext = path.extname(fileName).substr(1);

	const randomPath = new RandomPath(rootPath, ext, level);

	return randomPath.createPath();
}
