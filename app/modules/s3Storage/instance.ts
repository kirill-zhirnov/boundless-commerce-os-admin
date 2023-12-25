import {wrapperRegistry} from '../registry/server/classes/wrapper';
import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';
import md5 from 'md5';
import {ReadStream, WriteStream} from 'fs';
import {
	S3Client,
	PutObjectCommand, PutObjectCommandInput,
	CopyObjectCommand, CopyObjectCommandInput,
	ListObjectsV2Command, ListObjectsV2CommandInput, _Object,
	HeadObjectCommand, HeadObjectCommandInput,
	GetObjectCommand, GetObjectCommandInput,
	DeleteObjectCommandInput, DeleteObjectCommand, DeleteObjectOutput,
	DeleteObjectsCommandInput, DeleteObjectsCommand,
	ListObjectsCommand, ListObjectsCommandInput
} from '@aws-sdk/client-s3';
import path from 'path';
import {v4 as uuidv4} from 'uuid';

export default class InstanceS3Storage {
	protected client: S3Client;

	constructor(protected instanceRegistry: IInstanceRegistry) { }

	async upload(stream: ReadStream, localPath: string, props: IS3UploadProps = {}) {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const Key = this.makeObjectKeyByPath(localPath);

		const input: PutObjectCommandInput = {
			Body: stream,
			Bucket: bucket,
			Key
		};

		if (props.contentType) {
			input.ContentType = props.contentType;
		}

		const command = new PutObjectCommand(input);
		return this.getClient().send(command);
	}

	async copy(srcPath: string, dstPath: string) {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const CopySource = `${bucket}/${this.makeObjectKeyByPath(srcPath)}`;
		const Key = this.makeObjectKeyByPath(dstPath);

		const input: CopyObjectCommandInput = {
			Bucket: bucket,
			CopySource,
			Key
		};

		const command = new CopyObjectCommand(input);
		return this.getClient().send(command);
	}

	async download(writeStream: WriteStream, cloudPath: string) {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const Key = this.makeObjectKeyByPath(cloudPath);
		const input: GetObjectCommandInput = {
			Bucket: bucket,
			Key
		};

		const command = new GetObjectCommand(input);
		const data = await this.getClient().send(command);

		if (!data?.Body) {
			throw new Error('DownloadFile: body is empty.');
		}

		const outPromise = new Promise<void>((resolve) => {
			writeStream.on('finish', () => resolve());
		});

		//@ts-ignore
		data.Body.pipe(writeStream);

		return outPromise;
	}

	async delete(cloudPath: string) {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const Key = this.makeObjectKeyByPath(cloudPath);

		return this.deleteByPath(bucket, Key);
	}

	async deleteImgWithThumbs(cloudPath: string) {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const ext = path.extname(cloudPath);
		const baseName = path.basename(cloudPath, ext);
		const dirName = path.dirname(cloudPath);

		const listInput: ListObjectsCommandInput = {
			Bucket: bucket,
			Prefix: this.makeObjectKeyByPath(`${dirName}/${baseName}`)
		};

		const listCommand = new ListObjectsCommand(listInput);
		const {Contents} = await this.getClient().send(listCommand);

		if (!Contents || !Contents.length) return;

		const Objects = Contents.map(el => ({Key: el.Key}));
		const deleteInput: DeleteObjectsCommandInput = {
			Bucket: bucket,
			Delete: {
				Objects
			},
		};

		const deleteCommand = new DeleteObjectsCommand(deleteInput);
		return this.getClient().send(deleteCommand);
	}

	async makeUniquePath(folder: string, extension: string): Promise<string> {
		const randomStr = md5(`${folder}-${uuidv4()}-${extension}`);
		const filePath = `${folder}/${randomStr}.${extension}`;

		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const Key = this.makeObjectKeyByPath(filePath);

		const input: HeadObjectCommandInput = {
			Bucket: bucket,
			Key
		};

		const command = new HeadObjectCommand(input);
		try {
			await this.getClient().send(command);
			return this.makeUniquePath(folder, extension);
		} catch (err) {
			if (err.$metadata?.httpStatusCode === 404) {
				return filePath;
			} else {
				throw err;
			}
		}
	}

	async getSize(): Promise<number> {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const key = this.makeObjectKeyByPath('');

		return this.getFilesData<number>(bucket, key, (files, result) =>
			files.reduce((tmpSize, file) => file.Size + tmpSize, result || 0));
	}

	async deleteInstanceFolder() {
		const {instanceS3Storage: {bucket}} = wrapperRegistry.getConfig();
		const key = this.makeObjectKeyByPath('');
		await this.getFilesData<Promise<DeleteObjectOutput>>(bucket, key, (files, result) =>
			files.reduce(async (promise, file) =>
				(promise || Promise.resolve()).then(() => this.deleteByPath(bucket, file.Key)), result as Promise<DeleteObjectOutput>));
	}

	static async testConnection(): Promise<boolean> {
		const {instanceS3Storage: {endpoint, region, key, secret, bucket}} = wrapperRegistry.getConfig();

		const client = new S3Client({
			endpoint,
			region,
			credentials: {
				accessKeyId: key,
				secretAccessKey: secret
			}
		});

		const input: ListObjectsV2CommandInput = {Bucket: bucket};
		const data = await client.send(new ListObjectsV2Command(input));

		return true;
	}

	private async deleteByPath(bucket: string, key: string) {
		const input: DeleteObjectCommandInput = {
			Bucket: bucket,
			Key: key
		};

		const command = new DeleteObjectCommand(input);
		return this.getClient().send(command);
	}

	private async getFilesData<T = _Object[]>(
		bucket: string,
		prefix: string,
		predicate: (files: _Object[], res?: T) => T = (files, res: (T & _Object[])) => [...res, ...files] as T & _Object[],
		continuationToken?: string,
		tmpResult?: T
	): Promise<T> {
		const input: ListObjectsV2CommandInput = {Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken};
		const data = await this.getClient().send(new ListObjectsV2Command(input));
		const result = predicate(data.Contents || [], tmpResult);

		if (data.IsTruncated) {
			await new Promise(resolve => setTimeout(resolve, 50));
		}

		return (!data.IsTruncated)
			? result
			: this.getFilesData(bucket, prefix, predicate, data.NextContinuationToken, result);
	}

	makeObjectKeyByPath(localPath: string): string {
		let {instanceS3Storage: {folderPrefix}} = wrapperRegistry.getConfig();
		const instanceId = this.instanceRegistry.getInstanceInfo().instance_id;

		let key = `i${instanceId}/${localPath}`;

		if (folderPrefix) {
			if (!folderPrefix.endsWith('/'))
				folderPrefix += '/';

			key = `${folderPrefix}${key}`;
		}

		return key;
	}

	getClient() {
		if (!this.client) {
			const {instanceS3Storage: {endpoint, region, key, secret}} = wrapperRegistry.getConfig();

			this.client = new S3Client({
				endpoint,
				region,
				credentials: {
					accessKeyId: key,
					secretAccessKey: secret
				}
			});
		}

		return this.client;
	}
}

export interface IS3UploadProps {
	contentType?: string;
}