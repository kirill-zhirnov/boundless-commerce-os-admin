import {createHmac} from 'crypto';
import {wrapperRegistry} from '../registry/server/classes/wrapper';

export interface IWixParsedToken {
	instanceId: string,
	appDefId: string,
	signDate: string,
	uid: string,
	demoMode: boolean,
	siteOwnerId: string,
	siteMemberId: string,
	expirationDate: string,
	loginAccountId: string
	vendorProductId?: string;
}

export function wixInstanceTokenParser(token: string): false|IWixParsedToken {
	const config = wrapperRegistry.getConfig();
	const parts = token.split('.');

	if (parts.length != 2) {
		return false;
	}

	// eslint-disable-next-line prefer-const
	let [signature, data] = parts;
	signature = decodeFromBase64(signature, 'hex');

	const hashedKey = createHmac('sha256', config.wix.appSecret)
		.update(data)
		.digest('hex')
	;

	if (hashedKey !== signature) {
		return false;
	}

	return JSON.parse(decodeFromBase64(data, 'utf8'));
}

function decodeFromBase64(data: string, toEncoding: BufferEncoding): string {
	const buf = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
	return buf.toString(toEncoding);
}