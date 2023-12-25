// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const randomPath = require('../../../modules/randomPath/index');
const url = require('url');
const _ = require('underscore');
const fileType = require('file-type');
const readChunk = require('read-chunk');

class Downloader {
	constructor(instanceRegistry, path1, options) {
		this.instanceRegistry = instanceRegistry;
		this.path = path1;
		if (options == null) { options = {}; }
		this.options = options;
		this.localPrefix = '';

		if (!path.isAbsolute(this.path)) {
			this.localPrefix = this.path;
			this.path = this.instanceRegistry.getDataPath();
		}

		if (this.options.contentType && !_.isArray(this.options.contentType)) {
			this.options.contentType = [this.options.contentType];
		}
	}

	downloadFile(link) {
		const deferred = Q.defer();

		let error = null;
		let fileStream = null;

		const parsedLink = url.parse(link);

		const fileName = path.basename(parsedLink.pathname);
		const httpModule = parsedLink.protocol === 'https:' ? https : http;

		const relativePath = `${this.localPrefix}/` + randomPath.getByFileName(`${this.path}/${this.localPrefix}/`, fileName);
		const absolutePath = `${this.path}/${relativePath}`;

// 		Fixme: to allow https connections:
//		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

		const reqOptions = {
			hostname : parsedLink.hostname,
			path : encodeURI(parsedLink.path),
			method : 'GET',
			headers : {
				'User-Agent': 'Selliosbot/1.0 (+https://sellios.ru)'
			}
		};

		if (parsedLink.port) {
			reqOptions.port = parsedLink.port;
		}

		try {
			const request = httpModule.request(reqOptions, res => {
				error = this.checkHeaders(res);

				if (error) {
					handleError(error);
				}

				fileStream = fs.createWriteStream(absolutePath);
				let fileSize = 0;

				res.on('error', e => {
					return handleError(e);
				});

				res.on('data', chunk => {
					fileSize += chunk.length;

					if (this.options.sizeLimit && (this.options.sizeLimit < fileSize)) {
						return handleError(new Error('File size limit reached'));
					}
				});

				fileStream.on('error', e => {
					return handleError(e);
				});

				res.pipe(fileStream);

				return fileStream.on('finish', () => {
					if (error != null) {
						return;
					}

					const out = {
						fileName,
						absolutePath,
						relativePath
					};

					return this.validateOutput(out)
					.then(res => {
						return deferred.resolve(res);
				}).done();
				});
			});

			request.on('error', e => {
				return deferred.reject(e);
			});
			request.end();

		} catch (error1) {
			const e = error1;
			deferred.reject(e);
		}

		var handleError = e => {
			if (!fileStream) {
				deferred.reject(e);
				return;
			}

			error = e;
			return Q.ninvoke(fileStream, 'end')
			.then(() => {
				return Q.nfcall(fs.unlink, absolutePath);
		}).then(() => {
				return deferred.reject(e);
			}).catch(e => deferred.reject(e)).done();
		};

		return deferred.promise;
	}

	validateOutput(out) {
		if (path.extname(out.absolutePath) !== '') {
			return Q.resolve(out);
		}

		return Q(readChunk(out.absolutePath, 0, 4100))
		.then(buffer => {
			const res = fileType(buffer);

			const oldPath = out.absolutePath;
			out.absolutePath += `.${res.ext}`;
			out.relativePath += `.${res.ext}`;

			return Q.nfcall(fs.rename, oldPath, out.absolutePath);
	}).then(() => {
			return out;
		});
	}

	checkHeaders(res) {
		if (res.statusCode !== 200) {
			return new Error(`Response status-code is '${res.statusCode}'`);
		}

		const {
            headers
        } = res;
		if (this.options.sizeLimit && headers['content-length'] && (Number(headers['content-length']) > this.options.sizeLimit)) {
			return new Error('File is larger than allowed');
		}

		if (this.options.contentType && !_.contains(this.options.contentType, headers['content-type'])) {
			return new Error('Wrong file format');
		}

		return null;
	}
}

module.exports = Downloader;
