import dateExtended from 'date-extended';
import fs from 'fs';
import path from 'path';

export default class Creator {
	constructor(name) {
		this.name = name;
	}

	async create() {
		const now = new Date();

		const fileName = `m${dateExtended.format(now, 'yyMMdd_HHmmss')}_${this.name}.js`;
		const _path = path.join(__dirname, `../../../../migrations/${fileName}`);

		if (fs.existsSync(_path)) {
			throw new Error(`Migration already exists: ${fileName}`);
		}

		const content = fs.readFileSync(`${__dirname}/sample.js`, {encoding: 'utf8'});
		fs.writeFileSync(_path, content, {encoding: 'utf8'});

		return {
			path: _path,
			fileName
		};
	}
}