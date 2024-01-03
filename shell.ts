#!/usr/bin/env ts-node

import {runGeneral, shutDown} from './app/modules/bootstrap/wrapper';
import {runCmd} from './app/modules/commands/kit';

const parseCmd = function(args) {
	const out = {
		controller : args[2],
		action : args[3],
		options : {}
	};

	for (const arg of args) {
		const res = /^--([^=]+)=?([^\s]+)?$/.exec(arg);

		if (res) {
			out.options[res[1]] = res[2] ? res[2] : null;
		}
	}

	return out;
};

async function runCommand(controller, action, options) {
	try {
		await runGeneral();
		await runCmd(controllers[controller], action, options);
	} catch (e) {
		console.error(e);
	} finally {
		await shutDown();
	}
}

const controllers = {
	instance: '@modules/instanceManager/commands/instance',
	quickPay: '@modules/instanceManager/commands/quickPay',
	subscriptions: '@modules/instanceManager/commands/subscriptions',
	sample: '@modules/instanceManager/commands/sample',
	migrate: '@modules/migrate/commands/migrate',
	label: '@p-catalog/commands/label',
	mail: '@p-system/commands/mail',
	productImport: '@p-catalog/commands/productImport',
	backup: '@p-system/commands/backup',
	user: '@p-customer/commands/user',
	config: '@p-system/commands/config',
	space: '@modules/instanceManager/commands/space',
	selfHosted: '@modules/instanceManager/commands/selfHosted',
};

(async () => {
	const parsedRoute = parseCmd(process.argv);
	if (!(parsedRoute.controller in controllers)) {
		console.error(`Controller '${parsedRoute.controller}' not found. Available controllers:\n\n${Object.keys(controllers).join('\n')}\n`);
		return;
	}

	await runCommand(parsedRoute.controller, parsedRoute.action, parsedRoute.options);
})();