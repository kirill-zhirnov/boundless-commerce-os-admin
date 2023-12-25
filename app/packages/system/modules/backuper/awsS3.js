import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import pathAlias from 'path-alias';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';

export default class S3Backuper {
	constructor() {
		const {backup: {endpoint, region, key, secret}} = wrapperRegistry.getConfig();

		this.s3 = new AWS.S3({
			endpoint,
			region,
			signatureVersion: 'v4',
			credentials: {accessKeyId: key, secretAccessKey: secret}
		});
	}

	uploadFile(bucket, filePath) {
		const stream = fs.createReadStream(filePath);
		stream.on('error', e => {
			throw e;
		});

		const params = {
			Bucket: bucket,
			Key: path.basename(filePath),
			Body: stream
		};

		const options = {
			partSize: 20 * 1024 * 1024,
			queueSize: 2
		};

		return new Promise((resolve, reject) =>
			this.s3.upload(params, options, (err) => err ? reject(err) : resolve())
		);
	}

	getFiles(bucket) {
		const params = {
			Bucket: bucket
		};

		return new Promise((resolve, reject) =>
			this.s3.listObjectsV2(params, (err, data) => err ? reject(err) : resolve(data))
		);
	}

	deleteFiles(bucket, files) {
		const params = {
			Bucket: bucket,
			Delete: {
				Objects: files
			}
		};

		return new Promise((resolve, reject) =>
			this.s3.deleteObjects(params, (err) => err ? reject(err) : resolve())
		);
	}

	downloadFile(bucket, file, destination = pathAlias.getRoot()) {
		const destinationFile = path.resolve(destination, path.basename(file));

		const writeStream = fs.createWriteStream(destinationFile);

		const params = {
			Bucket: bucket,
			Key: file
		};

		const readStream = this.s3.getObject(params).createReadStream().pipe(writeStream);

		return new Promise((resolve, reject) => {
			writeStream.on('error', e => {
				writeStream.end();
				return reject(e);
			});

			readStream.on('error', e => {
				return reject(e);
			});

			writeStream.on('finish', () => {
				return resolve(destinationFile);
			});
		});
	}
}