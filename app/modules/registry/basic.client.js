export default class Registry {
	static initClass() {

		this.prototype.variables = null;
	}

	/*
	Constructs an instance of Registry. Called when simple-registry
	is first required.
	*/
	constructor() {
		this.variables = {};
	}

	/*
	Associates a value with a key. The key should be a string
	@param [String] key
	@param [Object] value
	*/
	set(key, value) {
		return this.variables[key] = value;
	}

	/*
	Returns the value previously associated with the given key.
	@param [String] key
	@return [Object]
	*/
	get(key) {
		return this.variables[key];
	}

	/*
	Returns true if the given key has been associated with
	a value.
	@param [String] key
	@return [Boolean]
	*/
	has(key) {
		return key in this.variables;
	}

	/*
	Removes any value associated with the given key.
	@param [String] key
	*/
	remove(key) {
		if (this.has(key)) {
			return delete this.variables[key];
		}
	}

	checkKey(key) {
		if (!this.has(key)) {
			throw new Error(`You must setup ${key} before calling this func!`);
		}

		return true;
	}

	import(data) {
		this.variables = data;

		return this;
	}

	export() {
		return this.variables;
	}

	reset() {
		this.variables = {};

		return this;
	}
}
Registry.initClass();
