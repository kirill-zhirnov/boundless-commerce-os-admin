import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import favicon from 'serve-favicon';
import pathAlias from 'path-alias';
// import {performance} from 'perf_hooks';

const RedisStore = require('connect-redis')(session);
import {wrapperRegistry} from '../registry/server/classes/wrapper';
import {requestWrapper} from './requestWrapper';
import InstanceRegistry from '../registry/server/classes/instance';
import {makeFrontController} from '../controller/front';

export function createExpress() {
	const config = wrapperRegistry.getConfig();
	const expressApp = express();

	// parse body
	const uploadLimit = '30mb';
	expressApp.use(bodyParser.json({
			limit: uploadLimit
		})
	);
	expressApp.use(bodyParser.urlencoded({
			extended: true,
			limit: uploadLimit,
			parameterLimit: 2000
		})
	);
	expressApp.use(bodyParser.raw({
			limit: uploadLimit
		})
	);

	// cookie
	expressApp.use(cookieParser(config.express.cookieSecret));

	const redisStore = new RedisStore({
		client: wrapperRegistry.getRedis(),
		prefix: 'bSess:'
	});


	const cookieProps = {
		httpOnly: true
	};
	// console.log('--- process.env.NODE_ENV:', process.env.NODE_ENV);

	if (process.env.NODE_ENV === 'production') {
		Object.assign(cookieProps, {
			//need for wix (iframe):
			sameSite: 'none',
			secure: true
		});
	}

	// session
	expressApp.use(session({
			store: redisStore,
			secret: config.express.cookieSecret,
			resave: false,
			saveUninitialized: true,
			cookie: cookieProps
		})
	);

	expressApp.use(favicon(`${pathAlias.getRoot()}/public/images/icons/favicon.ico`));

	expressApp.set('x-powered-by', false);
	expressApp.set('trust proxy', true);

	expressApp.all('*', requestWrapper.bind(null, async (instanceRegistry: InstanceRegistry, req: Request, res: Response) => {
		// performance.mark('front-controller-process');

		const fc = makeFrontController(instanceRegistry);
		await fc.runExpress(req, res);

		// performance.clearMarks();
	}));

	return expressApp;
}

export function startExpress() {
	const config = wrapperRegistry.getConfig();

	const expressApp = createExpress();
	expressApp.listen(config.express.port, function () {
		console.log('Worker %s started at http://%s:%s', process.pid, this.address().address, this.address().port);

		if (process.send) {
			// pm2 graceful start
			process.send('ready');
		}
	});
}
