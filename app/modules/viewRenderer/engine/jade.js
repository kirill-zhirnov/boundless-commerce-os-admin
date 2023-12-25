const pathAlias = require('path-alias');
const jade = require('../../jade/index');
const extend = require('extend');
const fs = require('fs');
const Q = require('q');
const _ = require('underscore');
const Compiler = require('../../jade/compiler');
const Parser = require('../../jade/parser');

import BasicRenderer from './basic';

export default class JadeRenderer extends BasicRenderer {
	constructor(config) {
		config = extend({
			extension: '.jade',
			engineConfig : {
				basedir : pathAlias.resolve('app/views'),
				compiler : Compiler,
				parser : Parser,
				doctype : 'html'
			}

		}, config);

		super(config);
	}

	compile2Str(source, options = {}) {
		//@ts-ignore
		return jade.compile2Str(source, _.extend({}, this.config.engineConfig, options));
	}

//	processCompile : (source, options = {}) ->
//		return jade.compile(source, _.extend({}, @config.engineConfig, options))

	processCompileClient(absolutePath, data = {}, cache = null) {
		this.extendData(data, this.config.engineConfig);

		const deferred = Q.defer();

		Q.nfcall(fs.readFile, absolutePath, {encoding: 'utf8'})
		.then(function(content) {
			//@ts-ignore
			const result = jade.compileClient(content, data);

			return deferred.resolve(result);}).catch(e => deferred.reject(e)).done();

		return deferred.promise;
	}
}
