const extend = require('extend');
const pathAlias = require('path-alias');
const errors = require('../../errors/errors');

export default class BasicRenderer {
	constructor(config) {
		this.config = {
			extension : '',
			globalPath : 'app/views',
			clientConfig : {
				url : '/getTpl/',
				urlBundle : '/getTplBundle/'
			},
//			config, which will be passes to engine
			engineConfig : {},
			publicLayouts : {}
		};

		this.setConfig(config);
	}

//	type - see comment for @localRender
	resolveLocalPath(type, file, packageName = null) {
		if ((type !== 'file') && (type !== 'absolute') && !packageName) {
			throw new Error(`If type is not a file you have to pass a package!. Passed: '${type}', '${file}', '${packageName}'`);
		}

//		add extension
		file = this.addExtension(file);

		switch (type) {
			case 'absolute':
				return pathAlias.resolve(`app/${file}`);
			case 'file':
				return pathAlias.resolve(`${this.config.globalPath}/${file}`);
			case 'controller':
				return pathAlias.resolve(`@p-${packageName}/views/${file}`);
			case 'widget':
				return pathAlias.resolve(`@p-${packageName}/widgets/views/${file}`);
		}
	}

//	Returns promise
	async compileClient(file, data) {
		return this.processCompileClient(file, data);
	}

	processCompile(source, options) {
		if (options == null) { options = {}; }
		throw new errors.NotImplemented('You must implement "processCompile" method in a successor');
	}

	async processCompileClient(absolutePath, data = {}) {
		throw new errors.NotImplemented('You must implement "processCompileClient" method in a successor');
	}

	extendData(data, newItems) {
		for (let key in newItems) {
			const val = newItems[key];
			//eslint-disable-next-line
			if (newItems.hasOwnProperty(key)) {
				if (data[key] != null) {
					throw new errors.RuntimeError(`Key ${key} already exists in template data!`);
				}

				data[key] = val;
			}
		}

		return data;
	}

	addExtension(file) {
		return `${file}${this.config.extension}`;
	}

	setConfig(config) {
		if (config != null) {
			extend(true, this.config, config);
		}

		return this.config;
	}

	getConfig() {
		return this.config;
	}

	getClientConfig() {
		return this.config.clientConfig;
	}
}