import Busboy from 'busboy';
import * as randomPath from '../../../modules/randomPath/index';
import fs from 'fs';
import path from 'path';
import {EventEmitter} from 'events';
import formatIo from 'format-io';
import BasicController from '../../../modules/controller/basic'; //eslint-disable-line
import {promisify} from 'util';

const unlink = promisify(fs.unlink);

// Events:
// - fileUploaded
// - validationError
// - finish

export default class ImageUploader extends EventEmitter {
	/**
	 * @param {BasicController} controller
	 * @param {string} folder - folder to upload
	 * @param {{}} config
	 */
	constructor(controller, folder, config = {}) {
		super();

		this.controller = controller;
		this.path = folder;
		this.instanceRegistry = this.controller.getInstanceRegistry();
		this.localPrefix = '';

		if (!path.isAbsolute(this.path)) {
			this.localPrefix = this.path;
			this.path = this.instanceRegistry.getDataPath();
		}

		this.busboy = new Busboy({
			headers: this.controller.getFrontController().getRequest().headers
		});

		this.validExtensions = [];
		this.validMimeTypes = [];
		this.maxFileSize = null;

		this.errors = [];
		this.files = [];

		this.config = Object.assign({
			removeAllListenersOnFinish: true,
			localPrefix: null
		}, config);

		if (this.config.localPrefix != null) {
			this.localPrefix = this.config.localPrefix;
		}
	}

	async process() {
		return new Promise((resolve) => {
			let f = Promise.resolve();
			this.busboy.on('file', (fieldName, fileStream, fileName, encoding, mimeType) => {
				if (this.validateBeforeTransfer(fieldName, fileName, encoding, mimeType)) {
					f = f.then(() =>
						this.saveFile({fieldName, fileStream, fileName, encoding, mimeType})
					);
				} else {
					this.emit('validationError');

					fileStream.resume();
				}
			});

			this.busboy.on('finish', async () => {
				await f;

				const out = {
					files: this.files,
					errors: this.errors
				};

				this.emit('finish', out);

				if (this.config.removeAllListenersOnFinish) {
					this.removeAllListeners();
				}

				resolve(out);
			});

			this.controller.getFrontController().getRequest().pipe(this.busboy);
		});
	}

	async saveFile({fieldName, fileStream, fileName, encoding, mimeType}) {
		return new Promise((resolve) => {
			const {absolutePath, relativePathPrefixed} = this.makeFilePaths(fileName);

			const writeStream = fs.createWriteStream(absolutePath);
			writeStream.on('finish', async () => {
				const stat = fs.statSync(absolutePath);
				this.emit('fileUploaded', relativePathPrefixed, fieldName, fileName, encoding, mimeType, stat);

				const hasErrors = await this.postUploadValidation(absolutePath, fieldName, stat);
				if (hasErrors) {
					await unlink(absolutePath);
				} else {
					this.files.push({
						absolutePath,
						relativePath: relativePathPrefixed,
						fieldName,
						fileName,
						encoding,
						mimeType,
						stat
					});
				}

				resolve();
			});

			fileStream.pipe(writeStream);
		});
	}

	async postUploadValidation(absolutePath, fieldName, stat) {
		let hasErrors = false;
		if (this.maxFileSize && (stat.size > this.maxFileSize)) {
			hasErrors = true;

			this.errors.push({
				fieldName,
				code: 'maxFileSizeExceeded',
				text: this.controller.__('Exceed maximum file size: %s.', [formatIo.size(this.maxFileSize)])
			});
		}

		const isUploadAllowed = await this.instanceRegistry.getTariff().checkStorageLimit({
			fileSize: stat.size || 0
		});
		if (!isUploadAllowed) {
			hasErrors = true;

			this.errors.push({
				fieldName,
				code: 'maxStorageExceeded',
				text: this.controller.__('Your storage limit is exceeded. Please upgrade your subscription plan.')
			});
		}

		return hasErrors;
	}

	makeFilePaths(fileName) {
		let relativePathPrefixed;
		const localPrefix = this.localPrefix !== '' ? `/${this.localPrefix}` : '';
		const relativePath = randomPath.getByFileName(`${this.path}${localPrefix}`, fileName);

		if (this.localPrefix !== '') {
			relativePathPrefixed = `${this.localPrefix}/${relativePath}`;
		} else {
			relativePathPrefixed = relativePath;
		}

		const absolutePath = `${this.path}${localPrefix}/${relativePath}`;

		return {absolutePath, relativePathPrefixed};
	}

	validateBeforeTransfer(fieldName, fileName, encoding, mimeType) {
		if (this.validExtensions.length > 0) {
			const ext = path.extname(fileName).substr(1).toLowerCase();

			if (!this.validExtensions.includes(ext)) {
				this.errors.push({
					fieldName,
					code: 'invalidExt',
					text: this.controller.getI18n().__('Extension "%s" is not allowed. Valid extensions: %s', [ext, this.validExtensions.join(' ')])
				});

				return false;
			}
		}

		if (this.validMimeTypes.length > 0) {
			if (!this.validMimeTypes.includes(mimeType)) {
				this.errors.push({
					fieldName,
					code: 'invalidMimeType',
					text: this.controller.getI18n().__('Mime type "%s" is not allowed. Valid mime types: %s', [mimeType, this.validMimeTypes.join(' ')])
				});

				return false;
			}
		}

		return true;
	}

	setValidExtensions(validExtensions) {
		this.validExtensions = validExtensions;
		return true;
	}

	setValidMimeTypes(validMimeTypes) {
		this.validMimeTypes = validMimeTypes;
		return true;
	}

	setMaxFileSize(maxFileSize) {
		this.maxFileSize = maxFileSize;
		return this;
	}

	getErrors() {
		return this.errors;
	}

	getFiles() {
		return this.files;
	}
}
