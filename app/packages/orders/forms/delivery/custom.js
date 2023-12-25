import BasicDeliveryForm from './basicDelivery';
// import Q from 'q';
import _ from 'underscore';
// import edostApi from 'edost-api';
import validator from '../../../../modules/validator/validator';

export default class CustomDeliveryForm extends BasicDeliveryForm {
	constructor(options) {
		super(options);

		this.defaultCountry = null;
		this.deliverySiteId = null;
		this.countries = [];
		this.cities = {};
		this.excludeCity = {};
		this.notRemoveCity = [];
		this.notRemoveExcludeCity = [];
		this.edostSettings = null;
		this.customEdostTariff = null;
	}

	getRules() {
		return [
			['title,tariff', 'required'],
			['sort', 'isNum'],

			// ['country_id', 'validateCountry'],
			// ['all_city', 'validateAllCity'],
			// ['city_id', 'validateCity'],
			// ['rate, delivery_time, country_delivery_time', 'safe'],
			// ['country_rate', 'validateCountryRateAndDelivery'],
			// ['exclude_city_id', 'safe'],
			// ['edostProvider', 'inOptions', {options: 'edostProviders'}],
			// ['edostProvider', 'validateProviderNotConfigured'],
			// ['edostProvider', 'vaildateCustomTariffs'],
			// ['edostId', 'validateEdostAccess'],
			// ['edostId', 'validateKeyNotDefault'],
			// ['edostPass', 'safe'],
			['tariff', 'inOptions', {options: 'tariff'}],

			['singlePrice', 'validateSinglePrice'],
			['description', 'safe'],

			// ['tax', 'inOptions', {options: 'tax'}],
		];
	}

	async setup() {
		await super.setup();

		if (this.scenario === 'insert') {
//				By default for a new records:
			this.attributes.tariff = 'single';
		}

		/*
		return this.getModel('shipping').findByAlias('edostCalc', this.getEditingLang().lang_id)
		.then(function(row) {
			this.edostSettings = row.settings;
			this.edostSettings.shipping_id = row.shipping_id;

			return SelfDelivery.prototype.__proto__.setup.call(this, ...arguments);}.bind(this)).then(() => {
			if (this.scenario === 'insert') {
//				By default for a new records:
				this.attributes.tariff = 'single';
			}

			return this.getRegistry().getSettings().get('system', 'defaultCountry');
		}).then(defaultCountry => {
			this.defaultCountry = defaultCountry;

			return Q.all([this.loadCountries(), this.loadCities(), this.loadExcludedCities()]);
		});*/
	}

	async setupAttrsByRecord() {
		await super.setupAttrsByRecord();

		this.record.shipping_config = this.record.shipping_config || {};
		this.attributes.tariff = this.record.calc_method;

		_.defaults(this.record.shipping_config, {
			price : null
		});

		if (this.attributes.tariff === 'single') {
			return this.attributes.singlePrice = this.record.shipping_config.price;
		}
	}

	async getTplData() {
		const data = await super.getTplData();

		_.extend(data, {
			countries : this.countries,
			cities : this.cities,
			excludeCities : this.excludeCity,
			defaultCountry : this.defaultCountry
		});

		return data;
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const data = this.getDeliveryAttrs();
		await this.getModel('delivery').update(data, {
			where: {
				delivery_id: this.pk
			}
		});
		await this.getModel('deliveryText').update({
			title: attrs.title,
			description: attrs.description
		}, {
			where : {
				delivery_id : this.pk,
				lang_id : this.getEditingLang().lang_id
			}
		});
		await this.saveDeliverySite();

		// if (attrs.tariff === 'byOwnRates') {
		// 	await this.saveDeliveryCountry();
		// }
		// await this.getModel('city').refreshCityDeliveryView();
	}

	getDeliveryAttrs() {
		let edost;
		const attrs = this.getSafeAttrs();

		const out = {
			calc_method : attrs.tariff,
			status: 'published',
			tax: attrs.tax
		};

		switch (attrs.tariff) {
			case 'single':
				out.shipping_config =
					{price : attrs.singlePrice};
				break;

			case 'byEdost':
				if (this.getRegistry().getInstanceInfo().is_demo && (attrs.edostId === 'DEMO')) {
					edost = this.edostSettings.demo;
				} else {
					edost = {
						id: attrs.edostId,
						pass: attrs.edostPass
					};
				}

				edost.provider = attrs.edostProvider;
				edost.providerAlias = this.getProviderAlias(edost.provider);

				if (this.customEdostTariff) {
					edost.tariff = this.customEdostTariff;
				}

				_.extend(out, {
					location_shipping_id: this.edostSettings.shipping_id,
					shipping_config: {
						edost
					}
				});
				break;
		}

		return out;
	}

	getProviderAlias(providerId) {
		for (let option of Array.from(this.options.edostProviders)) {
			if (Number(option[0]) === Number(providerId)) {
				return option[2];
			}
		}
	}

	async saveDeliverySite() {
		const DeliverySite = this.getModel('deliverySite');

		if (this.deliverySiteId) {
			if (this.attributes.sort !== '') {
				await DeliverySite.update({
					sort : this.attributes.sort
				}, {
					where : {
						delivery_site_id : this.deliverySiteId
					}
				});
			}
		} else {
			const row = await DeliverySite.build().set({
				site_id : this.getEditingSite().site_id,
				delivery_id : this.pk
			}).save();

			this.deliverySiteId = row.delivery_site_id;
		}
	}

	/*
	saveDeliveryCountry() {
		const deferred = Q.defer();

		const DeliveryCountry = this.getModel('deliveryCountry');
		const DeliveryCity = this.getModel('deliveryCity');

		const funcs = [];
		const notRemove = [];
		this.notRemoveCity = [];
		this.notRemoveExcludeCity = [];

		for (let countryId in this.attributes.country_id) {
			if (countryId === '__tmp') {
				continue;
			}

			notRemove.push(countryId);

			const f = (countryId => {
				return () => {
					const deferredItem = Q.defer();

					const allCity = this.attributes.all_city && (this.attributes.all_city[countryId] === '1') ? true : false;
					const rate = this.attributes.country_rate[countryId];
					const deliveryTime = this.attributes.country_delivery_time[countryId];

					Q(DeliveryCountry.find({
						where : {
							delivery_site_id : this.deliverySiteId,
							country_id : countryId
						}
					}))
					.then(row => {
						if (row) {
							return row.set({
								all_city : allCity,
								rate
							}).save();
						} else {
							return DeliveryCountry.build().set({
								delivery_site_id : this.deliverySiteId,
								country_id : countryId,
								all_city : allCity,
								rate
							}).save();
						}
				}).then(row => {
						return this.getModel('deliveryCountryText').update({
							delivery_time : deliveryTime
						}, {
							where : {
								delivery_country_id : row.delivery_country_id,
								lang_id : this.getEditingLang().lang_id
							}
						});
						})
					.then(() => {
						if (allCity) {
							return this.getDb().sql(`\
delete from \
delivery_city \
where \
delivery_site_id = :dsi \
and city_id in ( \
select \
city_id \
from \
city \
where \
country_id = :country \
)\
`, {
								dsi : this.deliverySiteId,
								country : countryId
							});
						} else {
							return this.saveDeliveryCities(countryId);
						}
				}).then(() => {
						return this.saveExcludeCities(countryId);
						}).then(() => {
						return deferredItem.resolve();
					}).done();

					return deferredItem.promise;
				};
			}
			)(countryId);

			funcs.push(f);
		}

		let result = Q();
		funcs.forEach(f => result = result.then(f));

		result
		.then(() => {
			const where =
				{delivery_site_id : this.deliverySiteId};

			if (notRemove.length > 0) {
				where.country_id =
					{$notIn : notRemove};
			}

			return DeliveryCountry.destroy({
				where
			});
	})
		.then(() => {
			const where =
				{delivery_site_id : this.deliverySiteId};

			if (this.notRemoveCity.length > 0) {
				where.city_id =
					{$notIn : this.notRemoveCity};
			}

			return DeliveryCity.destroy({
				where
			});
	})
		.then(() => {
			const where =
				{delivery_site_id : this.deliverySiteId};

			if (this.notRemoveExcludeCity.length > 0) {
				where.city_id =
					{$notIn : this.notRemoveExcludeCity};
			}

			return this.getModel('deliveryExcludeCity').destroy({
				where
			});
	})
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}
*/

	/*
	saveExcludeCities(countryId) {
		if (this.attributes.all_city[countryId] !== '1') {
			return;
		}

		const deferred = Q.defer();

		const DeliveryExcludeCity = this.getModel('deliveryExcludeCity');

		const funcs = [];
		for (let cityId in this.attributes.exclude_city_id[countryId]) {
			if (cityId === '__tmp') {
				continue;
			}

			this.notRemoveExcludeCity.push(cityId);

			const f = (cityId => {
				const deferredItem = Q.defer();

				const excludeAttrs = {
					delivery_site_id : this.deliverySiteId,
					city_id : cityId
				};

				Q(DeliveryExcludeCity.find({
					where : excludeAttrs
				}))
				.then(row => {
					if (!row) {
						return DeliveryExcludeCity.build()
						.set(excludeAttrs)
						.save();
					}
			}).then(() => {
					return deferredItem.resolve();
					}).done();

				return deferredItem.promise;
			}
			)(cityId);

			funcs.push(f);
		}

		let result = Q();
		funcs.forEach(f => result = result.then(f));

		result
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}
*/

	/*
	saveDeliveryCities(countryId) {
		const deferred = Q.defer();

		const attrs = this.getSafeAttrs();
		const DeliveryCity = this.getModel('deliveryCity');

		const funcs = [];
		for (let cityId in this.attributes.city_id[countryId]) {
			if (cityId === '__tmp') {
				continue;
			}

			this.notRemoveCity.push(cityId);

			const f = (cityId => {
				const deferredItem = Q.defer();

				const rate = attrs.rate[countryId][cityId];
				const deliveryTime = attrs.delivery_time[countryId][cityId];

				Q(DeliveryCity.find({
					where : {
						delivery_site_id : this.deliverySiteId,
						city_id : cityId
					}
				}))
				.then(row => {
					if (row) {
						return row.set({
							rate
						}).save();
					} else {
						return DeliveryCity.build().set({
							delivery_site_id : this.deliverySiteId,
							city_id : cityId,
							rate
						}).save();
					}
			}).then(row => {
					return this.getModel('deliveryCityText').update({
						delivery_time : deliveryTime
					}, {
						where : {
							delivery_city_id : row.delivery_city_id,
							lang_id : this.getEditingLang().lang_id
						}
					});
					})
				.then(() => {
					return deferredItem.resolve();
			}).done();

				return deferredItem.promise;
			}
			)(cityId);

			funcs.push(f);
		}

		let result = Q();
		funcs.forEach(f => result = result.then(f));

		result
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}*/

	async saveDeliveryNotUsed() {
		await this.getModel('deliverySite').destroy({
			where : {
				site_id : this.getEditingSite().site_id,
				delivery_id : this.pk
			}
		});
	}

	/*
	loadCountries() {
		const deferred = Q.defer();

		this.getDb().sql(`\
select \
c.country_id, \
all_city::int::text as all_city, \
c.title, \
rate, \
delivery_time \
from \
delivery_country dc \
inner join delivery_country_text dct on \
dc.delivery_country_id = dct.delivery_country_id \
and dct.lang_id = :lang \
inner join vw_country c on \
c.country_id = dc.country_id \
and c.lang_id = :lang \
where \
delivery_site_id = :dsi \
order by \
c.title asc\
`, {
			dsi : this.deliverySiteId,
			lang : this.getEditingLang().lang_id
		})
		.then(rows => {
			this.countries = rows;

			return deferred.resolve();
	}).done();

		return deferred.promise;
	}*/

	/*
	loadCities() {
		const deferred = Q.defer();

		const CityModel = this.getModel('city');
		this.getDb().sql(`\
select \
c.*, \
rate, \
delivery_time \
from \
delivery_city dc \
inner join delivery_city_text dct on dc.delivery_city_id = dct.delivery_city_id and dct.lang_id = :lang \
inner join vw_city c on \
c.city_id = dc.city_id \
and c.lang_id = :lang \
where \
delivery_site_id = :dsi \
and dct.lang_id = :lang \
order by \
c.city_title asc\
`, {
			dsi : this.deliverySiteId,
			lang : this.getEditingLang().lang_id
		})
		.then(rows => {
			this.cities = {};
			for (let row of Array.from(rows)) {
				if (!this.cities[row.country_id]) {
					this.cities[row.country_id] = [];
				}

				row.common_title = CityModel.createCommonTitle(row);
				this.cities[row.country_id].push(row);
			}

			return deferred.resolve();
	}).done();

		return deferred.promise;
	}*/

	/*
	loadExcludedCities() {
		const deferred = Q.defer();

		const CityModel = this.getModel('city');
		this.getDb().sql(`\
select \
c.* \
from \
delivery_exclude_city \
inner join vw_city c on \
c.city_id = delivery_exclude_city.city_id \
and c.lang_id = :lang \
where \
delivery_site_id = :dsi \
order by \
c.city_title asc\
`, {
			dsi : this.deliverySiteId,
			lang : this.getEditingLang().lang_id
		})
		.then(rows => {
			this.excludeCity = {};
			for (let row of Array.from(rows)) {
				if (!this.excludeCity[row.country_id]) {
					this.excludeCity[row.country_id] = [];
				}

				row.common_title = CityModel.createCommonTitle(row);
				this.excludeCity[row.country_id].push(row);
			}

			return deferred.resolve();
	}).done();

		return deferred.promise;
	}*/

	rawOptions() {
		return _.extend(super.rawOptions(), {
			// country : this.getModel('country').findOptions(this.getEditingLang().lang_id),
			// edostProviders : this.getModel('shippingOption').findOptions('edostCalc', this.getEditingLang().lang_id, 'edostProvider'),
			// edostCustomPickupTariffs: this.getModel('shippingOption').getEdostCustomPickupOptions(this.getI18n()),
			// edostCustomCourierTariffs: this.getModel('shippingOption').getEdostCustomCourierOptions(this.getI18n()),
			tariff : [
				['single', this.getI18n().__('Normal delivery option')],
				['byOwnRates', this.getI18n().__('Create own delivery rates with countries and cities')],
				['byEdost', this.getI18n().__('Use Edost.ru for delivery price calculations')]
			]
		});
	}
/*
	validateCountry(countryId) {
		if (!this.attributes['tariff'] || (this.attributes['tariff'] !== 'byOwnRates')) {
			return true;
		}

		const countryListId = [];
		for (let id in countryId) {
			if (id === '__tmp') {
				continue;
			}

			const name = `country_id[${id}]`;
			if (_.indexOf(countryListId, id) !== -1) {
				this.addError(name, 'countryNotUnique', this.getI18n().__('Country already selected!'));
			} else {
				countryListId.push(id);
			}
		}

		if (countryListId.length === 0) {
			this.addError('country_search', 'noCountry', this.getI18n().__('Please add at least one country, where you want to ship by given method.'));
		}

		return true;
	}

	validateAllCity() {
		if (this.attributes['tariff'] === 'byOwnRates') {
			for (let countryId in this.attributes.country_id) {
				if (this.hasErrors(`country_id[${countryId}]`)) {
					continue;
				}

				if (!this.attributes.all_city || !this.attributes.all_city[countryId]) {
					if (!this.attributes.city_id || !this.attributes.city_id[countryId] || (_.size(this.attributes.city_id[countryId]) === 0)) {
						this.addError(`all_city[${countryId}]`, "noCity", this.getI18n().__('You should tick "All cities" or add at least one city.'));
						return;
					}
				}
			}
		}

		return true;
	}

	validateCity(city) {
		if (this.attributes['tariff'] === 'byOwnRates') {
			for (let countryId in this.attributes.country_id) {
				if (countryId === '__tmp') {
					continue;
				}

				if (this.attributes.all_city && (this.attributes.all_city[countryId] === '1')) {
					continue;
				}

				for (let cityId in this.attributes.city_id[countryId]) {
					if (cityId === '__tmp') {
						continue;
					}

					let rate = '';
					if (this.attributes.rate && this.attributes.rate[countryId] && this.attributes.rate[countryId][cityId]) {
						rate = validator.trim(this.attributes.rate[countryId][cityId]);
					}

					let deliveryTime = '';
					if (this.attributes.delivery_time && this.attributes.delivery_time[countryId] && this.attributes.delivery_time[countryId][cityId]) {
						deliveryTime = validator.trim(this.attributes.delivery_time[countryId][cityId]);
					}

					const rateName = `rate[${countryId}][${cityId}]`;
					if (rate === '') {
						this.addError(rateName, "emptyRate", this.getI18n().__('Rate cannot be empty.'));
					} else {
						const validationResult = validator.isDotNumeric(rate);
						if (validationResult === false) {
							this.addError(rateName, 'notNumeric', this.getI18n().__('String should contain only numbers.'));
						}
					}

					if (deliveryTime === '') {
						this.addError(`delivery_time[${countryId}][${cityId}]`, "emptyDeliveryTime", this.getI18n().__('Delivery time cannot be empty.'));
					}
				}
			}
		}

		return true;
	}

	validateCountryRateAndDelivery() {
		if (this.attributes['tariff'] === 'byOwnRates') {
			for (let countryId in this.attributes.country_id) {
				if (countryId === '__tmp') {
					continue;
				}

				if (this.attributes.all_city[countryId] !== '1') {
					continue;
				}

				const rateName = `country_rate[${countryId}]`;
				const rateVal = validator.trim(this.attributes.country_rate[countryId]);

				const deliveryTimeName = `country_delivery_time[${countryId}]`;
				const deliveryTimeVal = validator.trim(this.attributes.country_delivery_time[countryId]);

				if (rateVal === '') {
					this.addError(rateName, 'required', this.getI18n().__('Value cannot be blank.'));
				}

				if (deliveryTimeVal === '') {
					this.addError(deliveryTimeName, 'required', this.getI18n().__('Value cannot be blank.'));
				}

				if (!this.hasErrors(rateName) && (validator.isDotNumeric(rateVal) === false)) {
					this.addError(rateName, 'notNumeric', this.getI18n().__('String should contain only numbers.'));
				}
			}
		}

		return true;
	}
*/

	/*
	validateKeyNotDefault() {
		if (this.attributes['tariff'] === 'byEdost') {
			if (!this.attributes.edostId || !this.attributes.edostPass) {
				return true;
			}

			if (!this.getInstanceRegistry().getInstanceInfo().is_demo && (this.edostSettings.demo.id === this.attributes.edostId)) {
				this.addError('edostId', 'apiIsDefault', this.getI18n().__('API params are the same as the system\'s demo. Please provide your own params.'));
				return true;
			}
		}

		return true;
	}*/

	/*
	validateEdostAccess(value, options, field, attributes) {
		if (attributes['tariff'] === 'byEdost') {
			const shopId = value;
			const edostPass = attributes['edostPass'];

			if ((shopId === '') && (edostPass === '')) {
				return true;
			}

			if (((shopId !== '') || (edostPass !== '')) && ((shopId === '') || (edostPass === ''))) {
				this.addError(field, 'wrongParams', this.getI18n().__('You should specify both id and password or leave them empty.'));
				return true;
			}

			if (this.getInstanceRegistry().getInstanceInfo().is_demo && (shopId === 'DEMO') && (edostPass === 'DEMO')) {
				return true;
			}

			const deferred = Q.defer();

			const api = edostApi.createApi(shopId, edostPass);
			api.calcDelivery(1019, 1, 1)
			.then(() => {
				return deferred.resolve(true);
		}).catch(() => {
				this.addError(field, 'failedReq', this.getI18n().__('Edost test request has failed, please check your id and password and try again.'));
				return deferred.resolve(true);
			}).done();

			return deferred.promise;
		}

		return true;
	}
*/

	/*
	validateProviderNotConfigured(value, options, field, attributes) {
		if (this.attributes['tariff'] === 'byEdost') {
			if (!value) {
				this.addError(field, 'noProvider', this.getI18n().__('Value cannot be blank.'));
				return true;
			}

			const deferred = Q.defer();

			this.getDb().sql('\
select \
* \
from \
delivery \
inner join delivery_site using(delivery_id) \
where \
shipping_id is null \
and location_shipping_id = :shippingId \
and site_id = :site \
and calc_method = \'byEdost\'\
', {
				site: this.getEditingSite().site_id,
				shippingId: this.edostSettings.shipping_id
			})
			.then(rows => {
				const exception = ['customSelfPickup', 'customCourier'];

				for (let row of Array.from(rows)) {
					const edostConf = row.shipping_config.edost;

					if (_.contains( exception, edostConf.providerAlias )) {
						if (Number(row.delivery_id) === Number(this.pk)) {
							continue;

						} else if (this.attributes['edostCustomPickup'] === edostConf.tariff) {
							this.addError('edostCustomPickup', 'tariffExist', this.getI18n().__('This tariff was already configured.'));
							break;

						} else if (this.attributes['edostCustomCourier'] === edostConf.tariff) {
							this.addError('edostCustomCourier', 'tariffExist', this.getI18n().__('This tariff was already configured.'));
							break;
						}

						continue;
					}

					if ((Number(row.delivery_id) !== Number(this.pk)) && (edostConf.provider === value)) {
						this.addError(field, 'providerExist', this.getI18n().__('This provider was already configured.'));
						break;
					}
				}

				return deferred.resolve(true);
		}).done();

			return deferred.promise;
		}

		return true;
	}*/

	/*
	vaildateCustomTariffs(value, options, field, attributes, form) {
		if (this.attributes['tariff'] === 'byEdost') {
			this.getDb().sql('\
select \
alias \
from \
shipping_option \
where \
option_id = :option \
limit 1\
', {
				option: value
			})
			.then(option => {
				switch (option[0].alias) {
					case 'customSelfPickup':
						var choosedTariff = Number(this.attributes['edostCustomPickup']);

						var isChoosedTariff = val => {
							return val[0] === choosedTariff;
						};

						if (!this.getModel('shippingOption').getEdostCustomPickupOptions( this.getI18n() ).some(isChoosedTariff)) {
							this.addError('edostCustomPickup', 'invalidTariff', this.getI18n().__('Invalid tariff for this kind of provider'));
							return true;
						}

						return this.customEdostTariff = this.attributes['edostCustomPickup'];

					case 'customCourier':
						choosedTariff = Number(this.attributes['edostCustomCourier']);

						isChoosedTariff = val => {
							return val[0] === choosedTariff;
						};

						if (!this.getModel('shippingOption').getEdostCustomCourierOptions( this.getI18n() ).some(isChoosedTariff)) {
							this.addError('edostCustomCourier', 'invalidTariff', this.getI18n().__('Invalid tariff for this kind of provider'));
							return true;
						}

						return this.customEdostTariff = this.attributes['edostCustomCourier'];
				}
		});
		}

		return true;
	}
*/

	validateSinglePrice(value, options, field) {
		if (this.attributes.tariff === 'single') {
			if (value === '') {
				this.addError(field, 'required', this.__('Value cannot be blank.'));
				return;
			}

			if (!validator.isDotNumeric(value)) {
				this.addError(field, 'isNum', this.__('String should contain only numbers.'));
				return;
			}

			return this.attributes[field] = this.preparePrice(value);
		}
	}

	preparePrice(val) {
		val = String(val).replace(',', '.');
		val = Number(val);

		return val;
	}
}
