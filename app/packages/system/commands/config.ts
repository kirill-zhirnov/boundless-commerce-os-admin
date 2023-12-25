import BasicCommand from '../../../modules/commands/basic';
import InstanceS3Storage from '../../../modules/s3Storage/instance';
import S3Backuper from '../modules/backuper/awsS3';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import {makeBroker} from '../../../modules/rabbitMq/utils';

export default class ConfigCommand extends BasicCommand {
	async actionTest() {
		console.log('testing InstanceS3Storage:', '\n');
		await InstanceS3Storage.testConnection();
		console.log('success!', '\n');

		// console.log('testing S3 backup connection:', '\n');
		// const {backup: {bucket}} = wrapperRegistry.getConfig();
		// const awsS3 = new S3Backuper();
		// const files = await awsS3.getFiles(bucket);
		// console.log('success!', '\n');

		console.log('testing babylon_saas connection:', '\n');
		await wrapperRegistry.getDb().sql('select now()');
		console.log('success!', '\n');

		console.log('testing delivery DB connection:', '\n');
		const packagesKit = wrapperRegistry.getPackagesKit();
		const deliveryDb = await packagesKit.get('delivery').getDeliveryDb();
		await deliveryDb.sql('select now()');
		console.log('success!', '\n');

		console.log('testing Redis connection:', '\n');
		await wrapperRegistry.getRedis().v4.get('test-key');
		console.log('success!', '\n');

		console.log('testing Rabbit MQ:', '\n');
		const broker = await makeBroker();
		await broker.shutdown();
		console.log('success!', '\n');
	}
}