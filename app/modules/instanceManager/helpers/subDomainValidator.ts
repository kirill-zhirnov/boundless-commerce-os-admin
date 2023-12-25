import CustomError, {TCustomErrorCode} from '../errors/CustomError';

const reservedSubDomains = ['demos', 'wix', 'wix-shop', 'wix-dashboard', 'examples'];

export function validateSubdomain(subdomain: string) {
	if (/^i\d+$/.test(subdomain)) {
		throw new CustomError(
			TCustomErrorCode.InvalidSubdomain,
			'Unacceptable subdomain. Subdomains can\'t match pattern i[number]'
		);
	}
	if (!(/^[a-z0-9-]+$/.test(subdomain))) {
		throw new CustomError(
			TCustomErrorCode.InvalidSubdomain,
			'Unacceptable subdomain. Subdomains can contain only latin letters, numbers and dash.'
		);
	}

	if (reservedSubDomains.includes(subdomain)) {
		throw new CustomError(
			TCustomErrorCode.InvalidSubdomain,
			'Subdomain is already taken.'
		);
	}
}