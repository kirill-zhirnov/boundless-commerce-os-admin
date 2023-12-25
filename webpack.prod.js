const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fs = require('fs');

let publicPath = 'auto';
// let config;
// if (fs.existsSync(path.resolve(__dirname, './config.js'))) {
// 	config = require('./config');
// } else if (fs.existsSync(path.resolve(__dirname, './.env'))) {
// 	require('dotenv').config();
// }
// if (config?.globalStatic?.host) {
// 	publicPath = `//${config.globalStatic.host}`;
// } else if (process.env.GLOBAL_STATIC_HOST) {
// 	publicPath = `//${process.env.GLOBAL_STATIC_HOST}`;
// }

const postCssLoader = {
	loader: 'postcss-loader',
	options: {
		postcssOptions: {
			plugins: [['postcss-preset-env', {}]],
		}
	}
};

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// webpackConfig.resolve.alias.vue = path.resolve('./node_modules/vue/dist/vue.runtime.esm.js');

module.exports = merge(common, {
	mode: 'production',
	output: {
		publicPath,
		filename: './js/[name].bundle.js',
		chunkFilename: './js/[name].[fullhash].bundle.js?ver=[chunkhash]',
		path: path.resolve(__dirname, 'public'),
	},
	plugins: [
		new VueLoaderPlugin(),
		new MiniCssExtractPlugin(),
		// new BundleAnalyzerPlugin({
		// 	analyzerMode: 'static'
		// }),
	],
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env']
						}
					},
					{
						loader: 'ts-loader',
						options: {
							compilerOptions: require('./tsconfig.json').compilerOptions
						},
					}
				],
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
					{ loader: 'css-loader' },
					postCssLoader,
				],
			},

			{
				test: /\.less$/,
				use: [
					{loader: MiniCssExtractPlugin.loader},
					// {loader: 'style-loader'},
					{loader: 'css-loader'},
					postCssLoader,
					{
						loader: 'less-loader'
					}
				]
			},
			{
				test: /\.scss$/,
				use: [
					{loader: MiniCssExtractPlugin.loader},
					{
						loader: 'css-loader',
					},
					postCssLoader,
					{
						loader: 'sass-loader',
					},
				],
			},
		]
	}
});