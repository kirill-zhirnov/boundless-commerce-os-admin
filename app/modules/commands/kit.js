const pathAlias = require('path-alias');
const _ = require('underscore');
const utils = require('../utils/common.client');

export async function runCmd(commandPath, action, options) {
	let Command = require(pathAlias.resolve(commandPath));

	if (Command.default)
		Command = Command.default;

	const command = new Command(options);

	const preparedAction = utils.ucfirst(action);
	const methodName = `action${preparedAction}`;
	if (!_.isFunction(command[methodName])) {
		throw new Error(`action '${action}' does not exist for '${commandPath}'!`);
	}

	return command[methodName]();
}