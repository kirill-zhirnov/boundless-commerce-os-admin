const BasicCommand = require('../../../modules/commands/basic');
const wrapperBootstrap = require('../../../modules/bootstrap/wrapper');
const instances = require('../../../modules/instances');
const env = require('../../../modules/env');
const instanceRegistry = require('../../../modules/registry/server/instance')
const ReviewRequest = require('../modules/reviewRequest');

class ReviewRequestCommand extends BasicCommand {
	async actionGetSetting() {
		const instanceId = this.getOption('instance');

		const bootstrapInstance = await wrapperBootstrap('bootstrapInstance', instanceId);
		const instanceRegistry = bootstrapInstance.getInstanceRegistry();

		console.log(await instanceRegistry.getSettings().get('orders', 'requestForReview'));
	}

	async actionSetSetting() {
		const instanceId = this.getOption('instance');
		const active = this.getOption('active');
		const sendDelay = this.getOption('sendDelay');
		const repeatDelay = this.getOption('repeatDelay');

		const bootstrapInstance = await wrapperBootstrap('bootstrapInstance', instanceId);
		const instanceRegistry = bootstrapInstance.getInstanceRegistry();

		const settingValue = await instanceRegistry.getSettings().get('orders', 'requestForReview');

		if (active !== null) {
			settingValue.isActive = (active == '1') ? true : false;
		}

		if (sendDelay && parseInt(sendDelay)) {
			settingValue.sendDelay = parseInt(sendDelay);
		}

		if (repeatDelay && parseInt(repeatDelay)) {
			settingValue.repeatDelay = parseInt(repeatDelay);
		}

		await instanceRegistry.getSettings().set('orders', 'requestForReview', settingValue);

		console.log(`Setting for instance "${instanceId}" was successfully switched to:`, settingValue);
	}

	async actionCron() {
		await wrapperBootstrap('setupInstances');
		const loadedInstances = await instances.loadCachedData();

		const instanceIds = Object.keys(loadedInstances.instances);

		for (const instanceId of instanceIds) {
			const registry = instanceRegistry.getRegistryByInstance(instanceId);
			const instanceEnv = await env.create(registry).getEnv();

			const reviews = new ReviewRequest(instanceEnv);
			await reviews.make();

			// console.log('--registry', registry)
			// console.log('--instanceEnv', instanceEnv)
		}
	}
}

module.exports = ReviewRequestCommand;