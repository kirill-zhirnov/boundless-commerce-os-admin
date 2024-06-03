const jadeIndex = require('jade/lib/index');

const Parser = require('jade/lib/parser');
const Compiler = require('jade/lib/compiler');
const runtime = require('jade/lib/runtime');
const addWith = require('with');
const utils = require('jade/lib/utils');

// import {wrapperRegistry} from '../registry/server/classes/wrapper';

// const {VM, VMScript} = require('vm2');
// const parseScript = new VMScript('parse(str, options)');

//Parse function was copied without any changes from node_modules/jade/lib/index.

function parse(str, options){
	if (options.lexer) {
		console.warn('Using `lexer` as a local in render() is deprecated and '
		   + 'will be interpreted as an option in Jade 2.0.0');
	}

	// Parse
	let parser = new (options.parser || Parser)(str, options.filename, options);
	let tokens;
	try {
		// Parse
		tokens = parser.parse();
	} catch (err) {
		parser = parser.context();
		runtime.rethrow(err, parser.filename, parser.lexer.lineno, parser.input);
	}

	// Compile
	const compiler = new (options.compiler || Compiler)(tokens, options);
	let js;
	try {
		js = compiler.compile();
	} catch (err) {
		if (err.line && (err.filename || !options.filename)) {
			runtime.rethrow(err, err.filename, err.line, parser.input);
		} else {
			if (err instanceof Error) {
				err.message += '\n\nPlease report this entire error and stack trace to https://github.com/jadejs/jade/issues';
			}

			throw err;
		}
	}

	// Debug compiler
	if (options.debug) {
		console.error('\nCompiled Function:\n\n\u001b[90m%s\u001b[0m', js.replace(/^/gm, '  '));
	}

	let globals = [];

	if (options.globals) {
		globals = options.globals.slice();
	}

	globals.push('jade');
	globals.push('jade_mixins');
	globals.push('jade_interp');
	globals.push('jade_debug');
	globals.push('buf');

	const body = ''
	+ 'var buf = [];\n'
	+ 'var jade_mixins = {};\n'
	+ 'var jade_interp;\n'
	+ (options.self
	? 'var self = locals || {};\n' + js
	: addWith('locals || {}', '\n' + js, globals)) + ';'
	+ 'return buf.join("");';
	return {body, dependencies: parser.dependencies};
}


jadeIndex.compile2Str = function(str, options) {
	let parsed;
	options = options || {};
	const filename = options.filename ? utils.stringify(options.filename) : 'undefined';
	let fn = null;

	str = String(str);

	// if (options.sandbox) {
	// 	const vm = new VM({
	// 		timeout: wrapperRegistry.getConfig().viewRenderer.vmTimeout,
	// 		sandbox: {
	// 			parse,
	// 			str,
	// 			options
	// 		}
	// 	});
	//
	// 	parsed = vm.run(parseScript);
	// } else {
	parsed = parse(str, options);
	// }

	if (options.compileDebug !== false) {
		fn = [
			'var jade_debug = [ new jade.DebugItem( 1, ' + filename + ' ) ];'
			, 'try {'
			, parsed.body
			, '} catch (err) {'
			, '  jade.rethrow(err, jade_debug[0].filename, jade_debug[0].lineno' + (options.compileDebug === true ? ',' + utils.stringify(str) : '') + ');'
			, '}'
		].join('\n');
	} else {
		fn = parsed.body;
	}

	return `${fn}`;
};
//	return "(function(locals, jade){#{fn}})(locals,jadeRuntime)"

module.exports = jadeIndex;
