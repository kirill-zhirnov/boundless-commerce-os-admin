const packageJson = require('./package.json');
const webpack = require('webpack');

const pathAlias = require('path-alias');
const aliasesList = require('./app/config/pathAliases');
pathAlias.setAliases(aliasesList.shouldBeResolved, true);
pathAlias.setAliases(aliasesList.static, false);

const AdminChunkPlugin = require('./.webpack/adminChunkPlugin');
const adminChunkFiles = require('./.webpack/chunks/admin');
const clientUIChunkFiles = require('./.webpack/chunks/clientUI');
const adminUIChunkFiles = require('./.webpack/chunks/adminUI');
const cropperChunkFiles = require('./.webpack/chunks/cropper');
const chartJsChunkFiles = require('./.webpack/chunks/chartJs');

module.exports = {
	entry: {
		main: './app/client-entry/main.ts'
	},
	resolve: {
		extensions:  ['.ts', '.js', '.json'],
	},
	module: {
		rules: [
			{
				test: /\.(png|jpe?g|gif|svg|eot|woff|woff2|ttf)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							outputPath: 'css/assets',
						},
					},
				],
			},
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.__IS_SERVER__': false,
			'process.env.VERSION': `'${packageJson.version}'`
		}),

		new AdminChunkPlugin({
			adminChunkFiles: adminChunkFiles
		}),

		new AdminChunkPlugin({
			chunkName: 'clientUI',
			adminChunkFiles: clientUIChunkFiles
		}),

		new AdminChunkPlugin({
			chunkName: 'adminUI',
			adminChunkFiles: adminUIChunkFiles
		}),

		new AdminChunkPlugin({
			chunkName: 'cropper',
			adminChunkFiles: cropperChunkFiles
		}),

		new AdminChunkPlugin({
			chunkName: 'chartJs',
			adminChunkFiles: chartJsChunkFiles
		}),


		// new BundleAnalyzerPlugin({
		// 	analyzerMode: 'static'
		// }),

		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			_: 'underscore'
		}),
	]
};