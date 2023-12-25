module.exports = {
	staticAssetsHost: 'http://localhost:9001',

	staticCss: [],

	instanceManager: {
		setupDnsZone: false,
		hostForSubDomains: 'node',
		rmCmd: 'rm -rf',
		awaitingAmountPerCategory: 1,
		nginxReloadCmd: false,
		changeOwnerCmd: false,
		useHttps: false,
	},

	viewRenderer: {
		instanceView: {
			useCache: false,
			reCompileLess: true
		}
	}
};