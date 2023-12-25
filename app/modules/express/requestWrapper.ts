import {Request, Response, NextFunction} from 'express';
import {loadInstanceById} from '../instances';
import fs from 'fs';
import {promisify} from 'util';
import {bootstrapInstanceById} from '../bootstrap/instance';
import InstanceRegistry from '../registry/server/classes/instance';
const readFile = promisify(fs.readFile);
import {HttpError} from '../errors/errors';
import {wrapperRegistry} from '../registry/server/classes/wrapper';

export type TWrapperHandler = (instanceRegistry: InstanceRegistry, req: Request, res: Response, next: NextFunction) => void;

const hardcodedInstanceId = process.env.INSTANCE_ID || 1 ;

export async function requestWrapper(handler: TWrapperHandler, req: Request, res: Response, next: NextFunction) {
	try {
		const instance = await loadInstanceById(hardcodedInstanceId as number);

		if (!instance) {
			await replyInstanceNotFond(res);
			return;
		}

		const instanceRegistry = await bootstrapInstanceById(instance.instance_id);
		await handler(instanceRegistry, req, res, next);
	} catch (e) {
		if (e instanceof HttpError) {
			await replyWithHttpError(e, res);
		} else {
			await replyWithError(e, res);
		}
	}
}

async function replyInstanceNotFond(res: Response) {
	const html = await readFile(`${__dirname}/tpls/instanceNotFound.html`, {encoding:'utf8'});
	res.status(404).send(html);
}

async function replyWithHttpError(error: HttpError, res: Response) {
	let html = await readFile(`${__dirname}/tpls/httpError.html`, {encoding:'utf8'});

	const {status, message, parsedRoute} = error;

	const title = `${status} - ${message}`;
	let debug = '';
	if (wrapperRegistry.isDebug() && parsedRoute) {
		debug = `<p>Parsed route:</p><pre>${JSON.stringify(parsedRoute, null, '\t')}</pre>`;
	}

	html = html.replace('{debug}', debug);
	html = html.replace(/\{title\}/g, title);

	if (wrapperRegistry.isDebug()) {
		console.error(error);
	}

	res
		.status(status)
		.send(html)
	;
}

async function replyWithError(error: Error, res: Response) {
	let html = await readFile(`${__dirname}/tpls/errorResponse.html`, {encoding:'utf8'});

	let debug = '', content = 'We are working on solving the problem';
	if (wrapperRegistry.isDebug()) {
		content = error.message;
		debug = `<p><strong>Stack:</strong><br/>${error.stack.replace(/\n/g, '<br/>')}</p>`;
	}

	html = html.replace(/\{title\}/g, 'Error');
	html = html.replace('{debug}', debug);
	html = html.replace('{content}', content);

	console.error(error);

	res
		.status(500)
		.send(html)
	;
}