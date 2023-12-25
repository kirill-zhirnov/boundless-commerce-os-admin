const pathAlias = require('path-alias');
const ShippingRatesAdmin = pathAlias('@p-orders/dataProvider/admin/shippingRates');

class SnailMailRates extends ShippingRatesAdmin {
	getRules() {
		return [
			['postcode,region_id,city_id', 'required']
		];
	}

	createQuery() {
		this.createBasicQuery();
		this.q.where("vw_shipping.alias = 'rusSnailMail'");
	}

	getRealLang() {
		return this.getLang();
	}

	getRealSite() {
		return this.getSite();
	}
}

module.exports = SnailMailRates;