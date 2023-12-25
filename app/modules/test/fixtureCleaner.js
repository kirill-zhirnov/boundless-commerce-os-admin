// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Reader = require('sequelize-fixtures/lib/reader.js');
const Q = require('q');
const _ = require('underscore');

const reader = new Reader({
	log : console.log
});

module.exports.cleanByFile = function(file, models) {
	const deferred = Q.defer();

	reader.readFile(file)
	.then(function(data) {
		const funcs = [];
		for (let start = data.length - 1, i = start, asc = start <= 0; asc ? i <= 0 : i >= 0; asc ? i++ : i--) {
			const Model = models[data[i].model];
			let pk = _.pick(data[i].data, Model.primaryKeyAttributes);

			if (_.size(pk) !== Model.primaryKeyAttributes.length) {
				pk = data[i].data;
			}

			funcs.push((((Model, pk) => () => Q(Model.destroy({where : pk}))))(Model, pk)
			);
		}

		let result = Q();
		funcs.forEach(f => result = result.then(f));

		return result
		.then(() => deferred.resolve()).done();}).done();

	return deferred.promise;
};
