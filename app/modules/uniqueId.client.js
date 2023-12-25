export default class UniqueId {
	static initClass() {
		this.KEY  = 'uniqueId';
	}

	constructor(session = {}, prefix = null) {
		this.session = session;
		this.prefix = prefix;
		if (!this.prefix) {
			this.prefix = process.env.__IS_SERVER__ ? 's-' : 'c-';
		}
	}

	getNext() {
		if (!(UniqueId.KEY in this.session)) {
			this.session[UniqueId.KEY] = 0;
		} else {
			this.session[UniqueId.KEY]++;
		}

		return this.session[UniqueId.KEY];
	}

	createId() {
		while (true) {
			const id = `${this.prefix}${this.getNext()}`;

//			if server - just return it
//			if client - additional check with DOM
			if (process.env.__IS_SERVER__) {
				return id;
			} else if (!document.getElementById(id)) {
				return id;
			}
		}
	}

	setPrefix(prefix) {
		this.prefix = prefix;
		return this;
	}

	getPrefix() {
		return this.prefix;
	}
}
UniqueId.initClass();