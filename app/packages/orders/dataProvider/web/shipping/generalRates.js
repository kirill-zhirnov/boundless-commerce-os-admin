const ShippingRatesAdmin = require('../../admin/shippingRates');

class GeneralRates extends ShippingRatesAdmin {
	createQuery() {
		let cityId = parseInt(this.getSafeAttr('city_id'));
		if (!cityId)
			throw new Error('CityId cannot be empty or incorrect!');

		this.createBasicQuery();
		this.appendCityIdConditions(cityId);
	}

	prepareData(rows) {
		let hasSnailMail = false;

		rows = rows.filter((row) => {
			if (row.shipping_alias == 'rusSnailMail') {
				hasSnailMail = true;
				return false;
			}

			return true;
		});

		return super.prepareData(rows)
		.then((res) => {
			return this.groupByType(res.data, hasSnailMail);
		});
	}

	groupByType(rows, hasSnailMail) {
		if (!Array.isArray(rows))
			return {};

		let groups = {};
		let sorted = [];

		rows.forEach((row) => {
			if (!row.sub_type)
				row.sub_type = 'courier';

			if (!(row.sub_type in groups)) {
				groups[row.sub_type] = {
					min: 0,
					items: []
				};
			}

			groups[row.sub_type].items.push(row);

			let rate = Number(row.rate);
			if (!isNaN(rate) && (!groups[row.sub_type].min || rate < groups[row.sub_type].min))
				groups[row.sub_type].min = rate;
		});

		if (hasSnailMail)
			groups.snailMail = true;

		['courier', 'pickupPoint', 'snailMail'].forEach((key) => {
			if (key in groups)
				sorted.push(key);
		});

		return {
			grouped: groups,
			groupsSorted: sorted
		};
	}

	getRealLang() {
		return this.getLang();
	}

	getRealSite() {
		return this.getSite();
	}

	getRatesCalculatorConfig() {
		return {
			titleSubTypePrefix: false
		}
	}
}

module.exports = GeneralRates;