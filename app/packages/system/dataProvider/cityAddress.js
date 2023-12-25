// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const DataProvider = pathAlias('@modules/dataProvider/index');
const validator = pathAlias('@modules/validator/validator');
const Q = require('q');
const wrapperRegistry = pathAlias('@wrapperRegistry');
const utils = pathAlias('@utils');

class CityAddressDataProvider extends DataProvider {
	constructor(options) {
		super(...arguments);

		({person: this.person} = options);
		this.sphinx = wrapperRegistry.getSphinx();
	}

	getRules() {
		return [
			['title, noChecked', 'safe'],
			['country_id', 'isNum'],
			['country_id', 'required']
		].concat(super.getRules(...arguments));
	}

	createQuery() {
		const deferred = Q.defer();

		const attrs = this.getSafeAttrs();

		if (!attrs.country_id) {
			throw new Error("CountryId cannot be empty!");
		}

		this.findCitiesBySphinx()
		.then(idList => {
			this.buildSqlQuery(idList);

			return deferred.resolve();
	}).done();

		return deferred.promise;
	}

	buildSqlQuery(idList) {
		const joinValues = this.sphinx.generateJoinValues(idList);

		this.q.field('city.city_id', 'id');
		this.q.field('city_title');
		this.q.field('region_title');
		this.q.field('area_title');
		this.q.field('is_important');

		this.q.from('vw_city', 'city');
		this.q.join('vw_delivery_city', "d", "city.city_id = d.city_id");
		this.q.join(`(${joinValues})`, "x(id, ordering)", "x.id = city.city_id");
		this.q.where("city.lang_id = ?", this.getLang().lang_id);
		this.q.where("d.site_id = ?", this.getSite().site_id);

		this.q.order('x.ordering', true);
		return this.q.limit(30);
	}

	prepareData(rows) {
		const out = [];

		let currentCityId = null;
		if (this.getSafeAttr('noChecked') !== '1') {
			currentCityId = this.getCurrentCityId();
		}

		for (let row of Array.from(rows)) {
			const outRow = {
				id : row.id,
				title : row.city_title,
				checked : (row.id === currentCityId)
			};

			if (!row.is_important) {
				if (row.area_title) {
					outRow.title += `, ${row.area_title}`;
				}

				if (row.region_title) {
					outRow.title += `, ${row.region_title}`;
				}
			}

			out.push(outRow);
		}

		return out;
	}

	getCurrentCityId() {
		if (this.person) { return this.person.city_id; } else { return null; }
	}

	setup() {
		return super.setup(...arguments)
		.then(() => {
			if (this.person != null) {
				return this.person;
			} else {
				return this.getModel('person').loadCustomerInfo(this.getUser().getId(), this.getLang().lang_id);
			}
	}).then(result => {
			return this.person = result;
		});
	}

	getPageSize() {
		return false;
	}

	findCitiesBySphinx() {
		const deferred = Q.defer();

		let indexSuffix = this.getEditingLang().code;
		indexSuffix = utils.ucfirst(indexSuffix);

		let criteria = "";

		const attrs = this.getSafeAttrs();
		const params =
			{country : parseInt(attrs.country_id)};

		if (attrs.title && (validator.trim(attrs.title).length >= 1)) {
			criteria = `\
and match(:query) \
order by my_weight desc \
limit 50 \
option field_weights=(city_title=500, region_title=1, area_title=1)\
`;

			params.query = this.sphinx.escapeSphinxParam(`${attrs.title}*`);
		} else {
			criteria = `\
and is_important = 1 \
order by \
city_title asc\
`;
		}

		const sqlText = `\
select \
id, \
weight() + is_important*100000 as my_weight \
from \
babylonCity${indexSuffix} \
where \
country_id = :country \
${criteria}\
`;

		this.sphinx.sql(sqlText, params)
		.then(rows => {
			const out = [];
			for (let row of Array.from(rows)) {
				out.push(row.id);
			}

			return deferred.resolve(out);
	}).done();

		return deferred.promise;
	}
}

module.exports = CityAddressDataProvider;
