const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const VueLoaderPlugin = require('vue-loader/lib/plugin')
// const CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = merge(common, {
	mode: 'development',
	output: {
		publicPath: 'http://localhost:9001/',
		filename: './js/[name].bundle.js',
		chunkFilename: './js/[name].bundle.js?ver=[chunkhash]',
		path: path.resolve(__dirname, 'public'),
	},
	devServer: {
		compress: true,
		port: 9001,
		hot: true,
		allowedHosts: ['all'],
		headers: {
			'Access-Control-Allow-Origin': '*'
		},
		// contentBase: path.resolve(__dirname, 'public/static'),
		// publicPath: '/app/',
	},
	plugins: [
		new VueLoaderPlugin(),

		/*
		new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,
			// include specific files based on a RegExp
			// include: /dir/,
			// add errors to webpack instead of warnings
			failOnError: true,
			allowAsyncCycles: false,
			// set the current working directory for displaying module paths
			cwd: process.cwd(),
		})*/
	],
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
				options: {
					compilerOptions: require('./tsconfig.json').compilerOptions
				},
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' }
				],
			},

			{
				test: /\.less$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'},
					{
						loader: 'less-loader',
						options: {}
					}
				]
			},

			{
				test: /\.scss$/,
				use: [
					{
						loader: 'style-loader',
					},
					{
						loader: 'css-loader',
					},
					// {
					// 	loader: 'postcss-loader',
					// 	options: {
					// 		postcssOptions: {
					// 			plugins: postCSSPlugins
					// 		}
					// 	}
					// },
					{
						loader: 'sass-loader',
					},
				],
			},
		]
	},
});