import BasicCommand from '../../commands/basic';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import {makeBroker} from '../../rabbitMq/utils';
import prompts from 'prompts';
import validator from 'validator';
import Starter from '../components/starter';
import DbCleaner from '../../../packages/system/modules/dbCleaner';
import {IPersonModel} from '../../../packages/customer/models/person';

export default class SelfHostedCommand extends BasicCommand {
	async actionInstall() {
		console.log('Starting installation...');

		if (!await this.testMinimalRequirements()) {
			console.error('Installation failed');
			return;
		}

		const response = await prompts({
			type: 'text',
			name: 'email',
			message: 'Enter an admin email:',
			validate: value => validator.isEmail(value) ? true : 'Incorrect Email'
		});

		console.log('Starting store installation...');
		const starter = new Starter(1, response.email);
		starter
			.setSendEmailNotification(false)
			.setSetupS3DemoFiles(false)
			.setShallPopulateWithDemoOrder(false)
		;
		await starter.start();
		const authConfig = starter.getAuthConf();
		console.log('The Db is ready, some more actions...');

		const instanceRegistry = await starter.getInstanceRegistry();
		const adminUser = (await instanceRegistry.getDb().model('person')
			.findOne({where: {is_owner: true}})) as IPersonModel
		;

		//clean DB from demo products:
		const cleaner = new DbCleaner(instanceRegistry, adminUser.person_id);
		cleaner.setRemoveFilesFromS3(false);
		await cleaner.clean();

		await instanceRegistry.getSettings().set('system', 'cleanUp', [new Date()]);

		console.log('Instance ID: ', instanceRegistry.getInstanceInfo().instance_id);
		console.log('Admin Email: ', adminUser.email);
		console.log('Admin password: ', authConfig.userPass, '\n');

		console.log('Thanks for choosing Boundless Commerce!');
	}

	async testMinimalRequirements(): Promise<boolean> {
		try {
			await wrapperRegistry.getDb().sql('select now()');
		} catch (e) {
			console.error('Cannot connect to babylon_saas', '\n');
			return false;
		}

		try {
			const packagesKit = wrapperRegistry.getPackagesKit();
			const deliveryDb = await packagesKit.get('delivery').getDeliveryDb();
			await deliveryDb.sql('select now()');
		} catch (e) {
			console.error('Cannot connect to delivery db', '\n');
			return false;
		}

		try {
			await wrapperRegistry.getRedis().v4.get('test-key');
		} catch (e) {
			console.error('Cannot connect to Redis', '\n');
			return false;
		}

		try {
			const broker = await makeBroker();
			await broker.shutdown();
		} catch (e) {
			console.error('Cannot connect to RabbitMQ', '\n');
			return false;
		}

		return true;
	}
}