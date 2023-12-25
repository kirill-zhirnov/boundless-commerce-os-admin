const validator = require('validator');
const _ = require('underscore');
const toString = require('../../validator/toString');

module.exports = i18n => (function(value, options, key, attributes, form) {
    _.defaults(options, {
        allowEmpty : true
    });

    value = toString(value);

    if (options.allowEmpty && (value === '')) {
        return true;
    }

    if (validator.isEmail(value)) {
        return true;
    }

    return {
        code : 'isEmail',
        message : i18n.__('String does not contain a valid email address.')
    };
});