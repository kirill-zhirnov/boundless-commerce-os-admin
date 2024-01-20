import {IJedExtended} from '../../../@types/i18n';
import toString from '../../validator/toString';

const isAliasValidator = (i18n: IJedExtended) => (function (value: any, options: {message?: string} = {}, key: string, attributes: {}) {
	options = {
		message: i18n.__('Wrong Alias: allowed only alphanumeric symbols, symbols "-" and "_".'),
		...options
	};

	value = toString(value);
	if (value === '') {
		return true;
	}

	if (/^[a-z0-9\-_]+$/i.test(value)) {
		return true;
	}

	return {
		code: 'alias',
		message: options.message
	};

});

export default isAliasValidator;