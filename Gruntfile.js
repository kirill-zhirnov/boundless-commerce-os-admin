// const fs = require('fs');
// const path = require('path');

// let config;
// if (fs.existsSync(path.resolve(__dirname, './config.js'))) {
// 	config = require('./config');
// } else if (fs.existsSync(path.resolve(__dirname, './.env'))) {
// 	require('dotenv').config();
// }

const lessFiles = {
	'public/css/email.css': 'app/views/less/email.less'
};

const webpackProdConfig = require('./webpack.prod');

module.exports = function (grunt) {
	const lessPlugins = [
		new (require('less-plugin-autoprefix'))({
			browsers: [
				'Android 2.3',
				'Android >= 4',
				'Chrome >= 20',
				'Firefox >= 24',
				'Explorer >= 8',
				'iOS >= 6',
				'Opera >= 12',
				'Safari >= 6'
			]
		}),
		new (require('less-plugin-clean-css'))({
			advanced: false,
			compatibility: 'ie8'
		})
	];

	const lessModifyVars = {};
	// if (process.env.GLOBAL_STATIC_HOST) {
	// 	const protocol = process.env.GLOBAL_STATIC_PROTOCOL || 'https';
	//
	// 	lessModifyVars['global-static-url'] = '"//' + process.env.GLOBAL_STATIC_HOST + '"';
	// 	lessModifyVars['global-static-url-email'] = '"' + protocol + '://' + process.env.GLOBAL_STATIC_HOST + '"';
	// } else if (config?.globalStatic?.host) {
	// 	lessModifyVars['global-static-url'] = '"//' + config.globalStatic.host + '"';
	// 	lessModifyVars['global-static-url-email'] = '"' + config.globalStatic.protocol + '://' + config.globalStatic.host + '"';
	// } else {
	// 	console.warn('To build local version you need to have config.js in the project root (htdocs) or /app/config/main.');
	// }

	grunt.initConfig({
		clean: {
			build: [
				'./public/css/*',
				'./public/js/*',
				'./public/main.css*',
				'./public/admin.css*',
				'./public/report.html',
			]
		},
		webpack: {
			prod: webpackProdConfig
		},
		less: {
			dev: {
				files: lessFiles,
				options: {
					paths: ['./'],
					plugins: lessPlugins,
					modifyVars: lessModifyVars
				},
			},
			//outdated:
			// production: {
			// 	files: lessFiles,
			// 	options: {
			// 		paths: ['./'],
			// 		plugins: lessPlugins,
			// 		modifyVars: lessProductionVars
			// 	},
			// }
		},
		compress: {
			brotli: {
				options: {
					mode: 'brotli',
					brotli: {
						mode: 0,
						quality: 11
					}
				},
				files: [
					{
						expand: true,
						cwd: './public/js',
						src: ['**/*.js'],
						extDot: 'last',
						ext: '.js.br',
						dest: './public/js'
					},
					{
						expand: true,
						cwd: './public',
						src: ['main.css', 'admin.css'],
						extDot: 'last',
						ext: '.css.br',
						dest: './public'
					},
				]
			},
			gzip: {
				options: {
					mode: 'gzip',
					level: 9
				},
				files: [
					{
						expand: true,
						cwd: './public/js',
						src: ['**/*.js'],
						extDot: 'last',
						ext: '.js.gz',
						dest: './public/js'
					},
					{
						expand: true,
						cwd: './public',
						src: ['main.css', 'admin.css'],
						extDot: 'last',
						ext: '.css.gz',
						dest: './public'
					}
				]
			}
		},
		watch: {
			less: {
				files: [
					'./app/views/less/**/*.less'
				],
				tasks: ['less:dev'],
				options: {
					spawn: false,
					debounceDelay: 100
				}
			}
		}
	});

	require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

	grunt.registerTask('default', ['less:dev']);
	grunt.registerTask('production', [
		'clean:build',
		'less:dev',
		'webpack:prod',
		'compress'
	]);
};