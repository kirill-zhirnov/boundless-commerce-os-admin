import cryptoMd5 from 'crypto-md5';
import _ from 'underscore';
export async function createByRegistry(instanceRegistry, personId, url, isAbsolute = true) {
	const token = await instanceRegistry.getDb().model('personToken').createToken('url', personId);

	const params = {
		id: token.token_id,
		token1: token.token_1,
		token2: token.token_2,
		url
	};
	params.sign = signUrl(instanceRegistry, params);

	return instanceRegistry.getRouter().url('auth/login/byUrl', params, isAbsolute);
}

export function create(controller, personId, url, isAbsolute) {
	if (isAbsolute == null) {
		isAbsolute = true;
	}
	const instanceRegistry = controller.getInstanceRegistry();
	const db = instanceRegistry.getDb();

	return db.model('personToken').createToken('url', personId)
		.then(token => {
			const params = {
				id: token.token_id,
				token1: token.token_1,
				token2: token.token_2,
				url
			};

			params.sign = this.signUrl(instanceRegistry, params);

			return controller.url('auth/login/byUrl', params, isAbsolute);
		});
}

export function signUrl(instanceRegistry, params, salt = null) {
	if (!salt) {
		({salt} = instanceRegistry.getConfig().auth);
	}

	const str = [salt];

	for (let key in params) {
		const val = params[key];
		str.push(`${key}=${val}`);
	}

	return cryptoMd5(str.join('|'), 'hex');
}

export async function validate(controller) {
	const instanceRegistry = controller.getInstanceRegistry();
	const db = instanceRegistry.getDb();

	const params = controller.getFrontController().getQuery();

	if (this.signUrl(instanceRegistry, _.omit(params, ['sign'])) !== params.sign) {
		return false;
	}

	const row = await db.model('personToken').findToken('url', params.id, params.token1, params.token2);
	if (!row) {
		return false;
	}

	await controller.getUser().authById(row.person_id);
	return params.url;
}