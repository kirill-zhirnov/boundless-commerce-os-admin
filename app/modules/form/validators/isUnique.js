const _ = require('underscore');
const toString = require('../../validator/toString');
const {Op} = require('sequelize');

// Available options:
// - field - required
// - row || null
// - model || null
// - criteria || {}
// - message || null - Error message.
// - allowEmpty:true - if true - do not validate empty strings
// - lower || null
module.exports = i18n => (async function (value, options, key, attributes, form) {
	_.defaults(options, {
		allowEmpty: true,
		lower: false
	});

	value = toString(value);

	if (options.allowEmpty && (value === '')) {
		return true;
	}

	options.row = await options.row;

	const result = await getModelByOptions(options, form.getDb()).count(buildCriteria(value, options, key));

	if (result > 0) {
		let message = options.message || i18n.__('"%s" has already been taken.');
		message = i18n.sprintf(message, value);

		throw {
			code: 'isUnique',
			message
		};
	}
});

const buildCriteria = function (value, options, key) {
	let criteria = {
		where: {}
	};

	let field = options.field || key;

	if (options.lower) {
		value = value.toLowerCase();
	}

	criteria.where[field] = value;

	if (options.row) {
		//@ts-ignore
		for (field of Array.from(options.row.constructor.primaryKeyAttributes)) {
			criteria.where[field] = {[Op.ne]: options.row.get(field)};
		}
	}

	if (options.criteria) {
		//this doesnt workj with new [Op.ne]: syntax
		// criteria = extend(true, criteria, options.criteria);

		if (options.criteria.where) {
			Object.assign(criteria.where, options.criteria.where);
		}
	}

	return criteria;
};

const getModelByOptions = function (options, db) {
	if (options.model) {
		return options.model;
	}

	if (options.row) {
		return db.model(options.row.constructor.tableName);
	}

	throw new Error('You must specify model or row');
};