import _ from 'underscore';

export default class InstanceExporter {
	constructor() {
		this.instances = null;
		this.reset();
	}

	set(type, id, instance) {
		if (!_.isFunction(instance.serialize)) {
			throw new Error('Instance does not have method serialize');
		}

		if (!(type in this.instances)) {
			throw new Error('Incorrect type!');
		}

		this.instances[type][id] = instance;

		return this;
	}

	get(type, id) {
		if (type in this.instances && id in this.instances[type]) {
			return this.instances[type][id];
		}

		return null;
	}

//	Prepare data for export to client side.
//	Convert hashes to Array - it will take less size
	export() {
		const out = {};

		for (let type in this.instances) {
			const instances = this.instances[type];
			const dataOfType = {};

			for (let id in instances) {
				const instance = instances[id];
				dataOfType[id] = instance.serialize();
			}

			if (_.size(dataOfType) > 0) {
				out[type] = dataOfType;
			}
		}

		return out;
	}

	reset() {
		this.instances = {
			widget: {},
			model: {},
			collection: {}
		};

		return this;
	}
}