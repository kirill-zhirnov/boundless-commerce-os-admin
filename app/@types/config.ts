import {IFrontControllerConfig} from '../modules/controller/front';
import {ConnectionAttributes} from 'rascal';

type S3ConnectionParams = {
	key: string,
	secret: string,
	bucket: string,
	endpoint: string,
	region: string
}

export interface IConfig {
	runtime: string;
	serverAlias: string;
	db: {
		name: string;
		user: string;
		pass: string;
		config: {
			host: string
		};
	},
	instanceDb: {
		config: {
			host: string;
			// port: number;
			// dialect: string;
			// timezone: string;
			// logging: boolean
		}
	},
	redis: {
		options: {}
	},
	viewRenderer: {
		config: {},
		vmTimeout: number;
		preCompileVue: boolean;
		instanceView: {
			useCache: boolean,
			reCompileLess: boolean
		}
	}
	imageMagick: {
		convertPath: string;
		identifyPath: string;
	},
	packages: {
		delivery: {
			deliveryDb: {
				name: string
			}
		}
	};
	staticCss: string[];
	staticAssetsHost: string;
	aws: {
		accessKeyId: string;
		secretAccessKey: string;
		region: string;
	},
	cache: {
		provider: string;
	},
	express: {
		port: number;
		host: string;
		publicPath: string;
		cookieSecret: string;
	},
	instancesPath: string;
	instanceManager: {
		useHttps: boolean;
		removeUnavailableAfterDays: number;
		samplesPath: string;
		hostForSubDomains: string;
		setupDnsZone: boolean;
		rmCmd: string;
		dns: {
			ip: string;
			hostedZoneId: string;
		},
		db: {
			sample: string;
		};
		nginx: {
			staticServer: {
				imageSalt: string;
				resizeAccessKey: string;
			}
		};
		changeOwnerCmd: string;
		payment: {
			quickPay?: {
				apiKey: string;
				privateKey: string;
				idPrefix?: string;
			}
		},
		import: {
			productRunArgs: string[];
			productFileDownloadArgs: string[];
		},

		nginxReloadCmd: string;

		demoDays: number;
		express: {
			port: number;
		},
		awaitingAmountPerCategory: number
	},
	deliveryViewDb: {
		user: string;
		pass: string
	},
	debug: boolean;
	router: {};
	nginx: {
		instanceStaticCache: boolean;
		baseHostConfig: string;
	};
	sslCert: {
		public: string;
		private: string;
	},
	frontController: Partial<IFrontControllerConfig>,
	analytics: {
		metrikaId?: string;
	},
	instanceS3Storage: {
		folderPrefix?: string;
		mediaServer: string;
	} & S3ConnectionParams,
	rabbitMQ: ConnectionAttributes,
	backup: {
		expire: number;
		storeAmount: number
		cmd: {[k: string]: string}
	} & S3ConnectionParams,
	memcached: {
		servers: string[]
	},
	wix: {
		dashboardHosts: string[],
		appSecret: string
	},
	boundlessApiBaseUrl?: string|null
}

export interface IInstanceConfig {
	db: {
		name: string;
		user: string;
		pass: string;
	},

	staticServer: {
		protocol: string;
		host: string;
		imageSalt: string;
		resizeAccessKey: string;
	},

	auth: {
		salt: string;
	}
}

// config exported to client-side
export interface IClientConfig {
	staticAssetsHost: string;
	staticServer: {
		protocol: string;
		host: string;
	},
	router: {
		baseUrl: string;
		importUrl: string;
	},
	locale: {},
	i18nKit: {
		localeUrl: string;
	},
	s3Storage: {
		mediaServer: string;
		folderPrefix: null|string;
	},
	analytics: {
		metrikaId?: string;
	},
}