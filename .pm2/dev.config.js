const path = require('path');
const rootPath = path.dirname(path.dirname(__filename));

module.exports = {
	apps: [
		{
			name: 'boundless-dev',
			script: 'index.ts',
			cwd: rootPath,
			instances: 1,
			exec_mode: 'cluster',
			merge_logs: true,
			watch: ['./app/**/*.ts', './app/**/*.js', './index.ts', './config.js'],
			ignore_watch: [
				"node_modules",
				"./app/vue/**/*.js",
				"./app/client-entry/*.js",
				"./app/modules/bootstrap/client/*.ts",
				"./app/modules/jquery/plugins/*",
				"./app/modules/ajax/*.js",
				"./app/modules/instanceManager/express/**/*.js",
				"./app/modules/navigation/*.js",
				"./app/modules/widget/simpleForm.client.js",
				"./app/packages/theme/bosses/*.js",
				"./app/packages/system/modules/aos.client.js",
				"./app/packages/system/widgets/vueApp.client.js",
				"./app/packages/orders/vue/**/*.js",
			],
			env: {
				NODE_ENV: 'development'
			}
		},

		{
			name: 'event-dev',
			script: 'eventServer.ts',
			cwd: rootPath,
			// instances: 1,
			exec_mode: 'fork',
			merge_logs: true,
			watch: ['./app/**/*.ts', './app/**/*.js', './index.ts', './config.js'],
			ignore_watch: [
				"node_modules",
				"./app/vue/**/*.js",
				"./app/client-entry/*.js",
				"./app/modules/bootstrap/client/*.ts",
				"./app/modules/jquery/plugins/*.js",
				"./app/modules/ajax/*.js",
				"./app/modules/instanceManager/express/**/*.js",
				"./app/modules/navigation/*.js",
				"./app/modules/widget/simpleForm.client.js",
				"./app/packages/theme/bosses/*.js",
				"./app/packages/system/modules/aos.client.js",
				"./app/packages/system/widgets/vueApp.client.js",
				"./app/packages/orders/vue/**/*.js",
			],
			env: {
				NODE_ENV: 'development'
			}
		}
		// {
		// 	name: 'instanceManager',
		// 	cwd: '/home/node/htdocs',
		// 	script: 'instanceManager .ts',
		// 	interpreter: '/usr/local/bin/coffee',
		// 	exec_mode: 'fork',
		// 	autorestart: true,
		// 	watch: [
		// 		'./app/modules/instanceManager/**/* .ts',
		// 		'./app/modules/instanceManager/**/*.js',
		// 		'./instanceManager .ts'
		// 	],
		// 	watch_delay: 1000,
		// 	env: {
		// 		NODE_ENV: 'development'
		// 	}
		// },
	]
};