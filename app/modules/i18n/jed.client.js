import Jed from 'jed';
import _ from 'underscore';

// http://messageformat.github.io/Jed/
export default class JedExtended extends Jed {
	t(originalMethod, originalArgs) {
		originalArgs = _.toArray(originalArgs);

		let sprintfArgs = null;
		const lastKey = originalArgs.length - 1;
		if ((originalArgs.length > 1) && _.isArray(originalArgs[lastKey])) {
			sprintfArgs = originalArgs.splice(lastKey, 1)[0];
		}

		let str = this[originalMethod].apply(this, originalArgs);

		if (sprintfArgs) {
			sprintfArgs.unshift(str);
			//@ts-ignore
			str = this.sprintf.apply(this, sprintfArgs);
		}

		return str;
	}

	__() {
		return this.t('gettext', arguments);
	}

	n__() {
		return this.t('ngettext', arguments);
	}

	p__() {
		return this.t('pgettext', arguments);
	}

	np__() {
		return this.t('npgettext', arguments);
	}
}
