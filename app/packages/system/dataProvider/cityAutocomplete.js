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

class CityAutocomplete extends DataProvider {
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
		const langId = this.getEditingLang().lang_id;

		return this.findCitiesBySphinx()
		.then(idList => {
			this.buildSqlQuery(idList);

		});
	}

	buildSqlQuery(idList) {
		const joinValues = this.sphinx.generateJoinValues(idList);

		this.q.field('city.city_id');
		this.q.field('city_title');
		this.q.field('region_id');
		this.q.field('region_title');
		this.q.field('area_title');
		this.q.field('is_important');

		this.q.from('vw_city', 'city');
		this.q.join(`(${joinValues})`, "x(id, ordering)", "x.id = city.city_id");
		this.q.where("city.lang_id = ?", this.getEditingLang().lang_id);

		return this.q.order('x.ordering', true);
	}

	getPageSize() {
		return false;
	}

	prepareData(rows) {
		const out = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const regionLabel = [];
			let label = row.city_title;

			if (!row.is_important) {
				if (row.area_title) {
					label += `, ${row.area_title}`;
					regionLabel.push(row.area_title);
				}

				if (row.region_title) {
					label += `, ${row.region_title}`;
					regionLabel.push(row.region_title);
				}
			}

			out.push({
				id : row.city_id,
				label,
				value : row.city_title,
				city : row.city_title,
				regionId: row.region_id,
				region: row.region_title,
				regionLabel: regionLabel.join(', ')
			});
		}

		return out;
	}

	findCitiesBySphinx() {
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
option field_weights=(city_title=500, is_important=10000, shipping_variants=1000, region_title=1, area_title=1)\
`;

			params.query = this.sphinx.escapeSphinxParam(`${attrs.q}*`);
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
weight() + is_important*100000 + shipping_variants*1000 as my_weight \
from \
babylonCity${indexSuffix} \
where \
country_id = :country \
${criteria}\
`;

		return this.sphinx.sql(sqlText, params)
		.then(rows => {
			const out = [];
			for (let row of Array.from(rows)) {
				out.push(row.id);
			}

			return out;
		});
	}
}

module.exports = CityAutocomplete;
