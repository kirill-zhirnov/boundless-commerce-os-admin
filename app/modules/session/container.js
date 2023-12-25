// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class SessionContainer {
	constructor(session, prefix = null) {
		this.session = session;
		this.prefix = prefix;
	}

	get(key, defaultValue = null) {
		const container = this.getContainer();

		if (key in container) {
			return container[key];
		}

		return defaultValue;
	}

	set(key, val) {
		const container = this.getContainer();

		container[key] = val;
		this.session[this.getPrefix()] = container;

		return this;
	}

	getPrefix() {
		if (!this.prefix) {
			throw new Error('Prefix cannot be empty!');
		}

		return this.prefix;
	}

	setPrefix(prefix) {
		this.prefix = prefix;
		return this;
	}

	getContainer() {
		if (!(this.getPrefix() in this.session)) {
			this.session[this.getPrefix()] = {};
		}

		return this.session[this.getPrefix()];
	}

	clear() {
		if (this.getPrefix() in this.session) {
			return delete this.session[this.getPrefix()];
		}
	}
}

module.exports = SessionContainer;