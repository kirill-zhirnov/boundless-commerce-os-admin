import {run} from './app/modules/bootstrap/wrapper';
import {startExpress} from './app/modules/express/express';

(async () => {
	try {
		await run();
		startExpress();
	} catch (e) {
		console.error(e);
	}
})();