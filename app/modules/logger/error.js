const winston = require('winston');
const pathAlias = require('path-alias');

const logger = new (winston.Logger)({
	exitOnError: false,
	transports: [
		new (winston.transports.File)({
			filename: pathAlias.resolve('runtime/errors.log'),
			handleExceptions: false,
			prettyPrint: true,
			maxsize: 4194304
		})
	]
});

module.exports = logger;