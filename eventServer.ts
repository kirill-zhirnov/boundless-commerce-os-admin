import {runGeneral} from './app/modules/bootstrap/wrapper';
import QueueEventSubscription from './app/modules/rabbitMq/subscription';

(async () => {
	try {
		await runGeneral();

		const eventSubscription = new QueueEventSubscription();
		await eventSubscription.startListener();

	} catch (e) {
		console.error(e);
	}
})();