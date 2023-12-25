const pathAlias = require('path-alias');

const runtime = pathAlias.resolve('runtime');
const debug = process.env.NODE_ENV !== 'production';

let staticCss = ['/main.css'];
if (process.env.CSS_FILES) {
	if (['false', '0'].includes(process.env.CSS_FILES)) {
		staticCss = [];
	} else {
		staticCss = String(process.env.CSS_FILES).split(',').filter(val => val !== '');
	}
}

let viewCache = true;
if (typeof process.env.VIEW_CACHE != 'undefined' && (!process.env.VIEW_CACHE || ['false', '0'].includes(process.env.VIEW_CACHE))) {
	viewCache = false;
}

const config = {
	runtime,

	express: {
		port: 3000,
		host: 'localhost',
		publicPath: pathAlias.resolve('public'),
		cookieSecret: 'secret'
	},

	viewRenderer: {
		engine: 'jade',
		config: {
			publicLayouts: {
				default: 'Default layout'
			}
		},
		instanceView: {
//			to debug - set to false
			useCache: viewCache,
			reCompileLess: !viewCache
		},

//		Compile vue templates on server. If yes - templates will be precompiled,
//		and for client will be used light version without compiler.
		preCompileVue: true,

		vmTimeout: 3500
	},

	db: {
		name: process.env.DB_NAME_SAAS || 'babylon_saas',
		user: process.env.DB_USER || 'postgres',
		pass: process.env.DB_PASS || '123',
		config: {
			host: process.env.DB_HOST || 'localhost',
			port: process.env.DB_PORT || 5432,
			dialect: 'postgres',
			timezone: '00:00',
			logging: debug ? console.log : false
		}
	},

	instanceDb: {
		config: {
			host: process.env.DB_HOST || 'localhost',
			port: process.env.DB_PORT || 5432,
			dialect: 'postgres',
			timezone: '00:00',
			logging: debug ? console.log : false
		}
	},

	deliveryViewDb: {
		user: process.env.DELIVERY_VIEW_DB_USER || 'delivery_view',
		pass: process.env.DELIVERY_VIEW_DB_PASS || '123'
	},

	packages: {
		system: {},
		auth: {},
		dashboard: {},
		catalog: {},
		inventory: {},
		orders: {},
		cms: {},
		// exchange : {},
		delivery: {
			deliveryDb: {
				name: process.env.DB_NAME_DELIVERY || 'delivery',
				user: process.env.DB_USER || 'postgres',
				pass: process.env.DB_PASS || '123',
				config: {
					host: process.env.DB_HOST || 'localhost',
					port: process.env.DB_PORT || 5432,
					dialect: 'postgres',
					timezone: '00:00',
					logging: debug ? console.log : false
				}
			}
		},
		customer: {},
		// theme : {},
		payment: {}
	},

	frontController: {},

	debug,

	cache: {
		provider: 'redis'
	},

	imageMagick: {
		convertPath: null,
		identifyPath: null
	},

	staticAssetsHost: process.env.STATIC_ASSETS_HOST || 'http://localhost:3001',

	//for production specify extracted css: ['/main.css']
	staticCss,

	instancesPath: pathAlias.resolve('instances'),

	instanceManager: {
		hostForSubDomains: process.env.HOST_FOR_SUBDOMAINS || 'my-boundless.app',
		setupDnsZone: false,
		dns: {
			ip: '',
			hostedZoneId: ''
		},

		db: {
			sample: 'babylon_sample'
		},

		nginx: {
			staticServer: {
				imageSalt: 'mkh0K6Hjk',
				resizeAccessKey: 'km7OndhU1230L'
			}
		},

		express: {
			port: 3007
		},

		awaitingAmountPerCategory: 15,

		rmCmd: 'sudo rm -rf',

		nginxReloadCmd: 'sudo nginx -s reload',

		changeOwnerCmd: 'sudo chown',

		import: {
			productRunArgs: [`${pathAlias.resolve('shell.ts')}`, 'productImport', 'run'],
			productFileDownloadArgs: [`${pathAlias.resolve('shell.ts')}`, 'productImport', 'download']
		},

		demoDays: 14,

		removeUnavailableAfterDays: 30,

		payment: {

		},

		useHttps: true,

		samplesPath: pathAlias.resolve('samples')
	},

	aws: {
		accessKeyId: process.env.AWS_SES_KEY,
		secretAccessKey: process.env.AWS_SES_SECRET,
		region: process.env.AWS_SES_REGION
	},

	clientLoader: {
		reload: false
	},

	analytics: {
		metrikaId: null
	},

	serverAlias: 'default',

	ARecordIp: null,

	nginx: {
		instanceStaticCache: false,
		baseHostConfig: 'base.conf'
	},

	backup: {
		key: 'key',
		secret: 'secret',
		endpoint: 'https://nyc3.digitaloceanspaces.com',
		region: 'nyc3',
		bucket: 'my-boundless-backups',
		expire: 365,
		storeAmount: 2,
		cmd: {
			pgDump: '/usr/bin/pg_dump',
			psql: '/usr/bin/psql'
		}
	},

	redis: {
		options: {
			url: process.env.REDIS_URL || 'redis://localhost'
			// socket: {
			// 	host: process.env.REDIS_HOST || 'localhost'
			// }
		}
	},

	memcached: {
		servers: [
			process.env.MEMCACHED_DSN || 'localhost:11211'
		]
	},

	realFaviconGeneratorKey: '',

	router: {},

	instanceS3Storage: {
		key: process.env.S3_KEY,
		secret: process.env.S3_SECRET,
		bucket: process.env.S3_BUCKET,
		endpoint: process.env.S3_ENDPOINT,
		region: process.env.S3_REGION,
		folderPrefix: process.env.S3_FOLDER_PREFIX || null,
		mediaServer: process.env.S3_MEDIA_SERVER || 'http://localhost:3010'
	},

	rabbitMQ: {
		hostname: process.env.RABBIT_MQ_HOST || 'localhost',
		port: process.env.RABBIT_MQ_PORT || 5672,
		user: process.env.RABBIT_MQ_USER,
		password: process.env.RABBIT_MQ_PASSWORD
	},

	wix: {
		dashboardHosts: ['wix-dashboard.node', 'wix-dashboard.my-boundless.app'],
		appSecret: ''
	},

	boundlessApiBaseUrl: null
};

module.exports = config;
