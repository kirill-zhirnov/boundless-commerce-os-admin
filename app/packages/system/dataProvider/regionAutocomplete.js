// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');
const Q = require('q');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const utils = pathAlias('@utils');
const validator = pathAlias('@modules/validator/validator');

class RegionAutocomplete extends DataProvider {
	initialize() {
		return this.sphinx = wrapperRegistry.getSphinx();
	}

	getRules() {
		return [
			['country', 'isNum'],
			['q,country', 'required']
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		const deferred = Q.defer();

		const langId = this.getEditingLang().lang_id;

		this.findRegionsBySphinx()
		.then(idList => {
			this.buildSqlQuery(idList);

			return deferred.resolve();
	}).done();

		return deferred.promise;
	}

	buildSqlQuery(idList) {
		const joinValues = this.sphinx.generateJoinValues(idList);

		this.q.distinct();
		this.q.field('region_id');
		this.q.field('region_title');
		this.q.field('x.ordering');

		this.q.from('vw_city', 'city');
		this.q.join(`(${joinValues})`, "x(id, ordering)", "x.id = city.region_id");
		this.q.where("city.lang_id = ?", this.getEditingLang().lang_id);
		this.q.limit('10');

		return this.q.order('x.ordering', true);
	}

	getPageSize() {
		return false;
	}

	prepareData(rows) {
		const out = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			out.push({
				id : row.region_id,
				label: row.region_title
			});
		}

		return out;
	}

	findRegionsBySphinx() {
		const deferred = Q.defer();

		let indexSuffix = this.getEditingLang().code;
		indexSuffix = utils.ucfirst(indexSuffix);

		let criteria = "";

		const attrs = this.getSafeAttrs();
		const params =
			{country : parseInt(attrs.country)};

		if (attrs.q && (validator.trim(attrs.q).length >= 1)) {
			criteria = `\
and match(:query) \
order by my_weight desc \
limit 10 \
option field_weights=(region_title=1000)\
`;

			params.query = this.sphinx.escapeSphinxParam(`${attrs.q}*`);
		} else {
			criteria = `\
order by region_title asc\
`;
		}

		const sqlText = `\
select \
region_id, \
weight() as my_weight \
from \
babylonRegion${indexSuffix} \
where \
country_id = :country \
and edost_region_id != 0 \
${criteria}\
`;

		this.sphinx.sql(sqlText, params)
		.then(rows => {
			const out = [];
			for (let row of Array.from(rows)) {
				out.push(row.region_id);
			}

			return deferred.resolve(out);
	}).done();

		return deferred.promise;
	}
}


module.exports = RegionAutocomplete;
