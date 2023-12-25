import Uploader from '../../../packages/cms/modules/uploader';
import _ from 'underscore';
import fs from 'fs';
import {promisify} from 'util';

const unlink = promisify(fs.unlink);

export default function () {
	return async function (value, options, key, attributes, form) {
		_.defaults(options, {
			fieldNameForErrors: false
		});

		if (!options.uploader || !(options.uploader instanceof Uploader)) {
			throw new Error('uploader must be an instance of Uploader');
		}

		const result = await options.uploader.process();

		if (result.errors.length > 0) {
			for (const error of Array.from(result.errors)) {
				let fieldName = 'file';
				if (options.fieldNameForErrors) {
					({
						fieldName
					} = error);
				}

				form.addError(fieldName, error.code, error.text);
				break;
			}

			for (const file of Array.from(result.files)) {
				await unlink(`${this.uploader.getPath()}/${file.relativePath}`);
			}
		}

		return true;
	};
}