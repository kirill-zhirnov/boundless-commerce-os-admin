const _ = require('underscore');
const pathAlias = require('path-alias');

module.exports.serialize = function(data) {
	if (_.isObject(data) && data) {
		const out = {};

		for (let key in data) {
			const val = data[key];
			if (_.isObject(val) && _.isFunction(val.serialize)) {
				const serialized = val.serialize();

				if (!_.isUndefined(serialized)) {
					out[key] = serialized;
				}
			} else {
				out[key] = val;
			}
		}

		return out;

	} else {
		return data;
	}
};

module.exports.unSerialize = function(data) {
	if (_.isObject(data) && 'path' in data && 'data' in data && (_.size(data) === 2)) {
		const obj = this.requireFile(data.path);

		if ('unSerialize' in obj && _.isFunction(obj.unSerialize)) {
			return obj.unSerialize(this.unSerialize(data.data));
		} else {
			throw new Error(`File '${data.path}' must have static method 'unSerialize'.`);
		}
	} else {
		if (_.isObject(data) && data) {
			for (let key in data) {
				const val = data[key];
				data[key] = this.unSerialize(val);
			}
		}

		return data;
	}
};

module.exports.requireFile = function(path) {
//	we need manually resolve file path and specify a path,
//	on other cases webpack will not resolve path correctly on the client:

	switch (path) {
		case 'app/modules/backbone/my/collection.client':
			return require('./backbone/my/collection.client').default;
	}

	//@ts-ignore
	const file = pathAlias(path);

	return (file && file.default) ? file.default : file;
};