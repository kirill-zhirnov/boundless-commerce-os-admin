import FormWidget from '../../../modules/widget/form.client';
// import ajax from '../../../modules/ajax/kit.client';
// import bs from '../../../modules/gHtml/bs.client';
// import gHtmlActive from '../../../modules/gHtml/active.client';
// import gHtml from '../../../modules/gHtml/index.client';
import $ from 'jquery';
import _ from 'underscore';
import bundles from '../../../modules/utils/bundles.client';
// import autocomplete from '../../system/modules/autocomplete.client';
import DropzoneWrapper from '../../cms/widgets/dropzoneWrapper.client';

// const Backbone = pathAlias('@bb');

export default class DeliveryForm extends FormWidget {
	constructor(options) {
		super(options);

		// this.cityAutocompleteSource = this.cityAutocompleteSource.bind(this);
		this.$countries = null;
		this.cities = {};
		this.excludeCities = {};
		this.edostProviders = {};

		// this.CityModel = Backbone.My.Model.extend({
		// 	idAttribute : 'city_id'
		// });

		this.autocompleteEls = [];
	}

	attributes() {
		return _.extend(super.attributes(), {
			action : this.url('orders/admin/setup/delivery/formCustom')
		});
	}

	run() {
		return this.render('deliveryForm', {
			// renderCountryBlock: this.renderCountryBlock.bind(this)
		});
	}

	events() {
		return _.extend(super.events(), {
			// 'change .all-city': 'onAllCityChange',
			// 'click .add-country': 'onAddCountryClicked',
			// 'click .rm-country': 'onRmCountryClicked',
			// 'click .cities .rm a': 'onRmCityClicked',
			// 'change .cities .rate-props input': 'onCityPropsChanged',
			// 'change .cities .delivery-time input': 'onCityPropsChanged',
			// 'click .exclude-cities-list .rm': 'onRmExcludeCityClicked',
			// 'change #edostProvider': 'onEdostProviderChange',
			'change input[name=\'tariff\']'(e) {
				this.$('[data-tariff]').hide();
				return this.$(`[data-tariff='${$(e.currentTarget).val()}']`).show();
			}
		});
	}

	runLazyInit() {
		return bundles.load('clientUI').then(() => {
			// this.$countries = this.$('.countries');
			// this.$countries.find('li.country').each((key, val) => {
			// 	return this.setupCountryBlockEvents($(val));
			// });

			this.setupDropZone();
		});
	}

	setupDropZone() {
		this.dropZone = new DropzoneWrapper(this.$('.dropzone-uploader').get(0), this.url('orders/admin/setup/delivery/imgUpload', {pk: this.getPk()}), {
			successMessage: false,
			onSuccessHook: (file, response) => {
				this.$('.uploaded-img')
					.removeClass('no-image')
					.css('background-image', `url(${response.d.uploadedData.www})`);
			}
		});
	}

	onTariffOptionsChange(e) {
		if ($(e.currentTarget).val() === 'edost') {
			this.$el.find('.edost-options-form').show();
			this.$el.find('.location-settings-group').hide();
		} else {
			this.$el.find('.location-settings-group').show();
			this.$el.find('.edost-options-form').hide();
		}
	}

	/*
	renderCountryBlock(country) {
		const locale = this.getLocale();
		const citiesHtml = this.renderCitiesBlock(country);
		const excludeCitiesHtml = this.renderExcludeCitiesBlock(country);
		const allCityAttrs = {
			name : `all_city[${country.country_id}]`,
			class : 'all-city'
		};

		const countryRateProps = {
			name: `country_rate[${country.country_id}]`,
			type: 'number',
			min: '0',
			lang:'en',
			step:'0.01'
		};

		const deliveryTimeProps = {
			name : `country_delivery_time[${country.country_id}]`,
			placeholder : this.getI18n().__('e.g. 1-2 days')
		};

		const countryPropsClasses = ['country-props'];
		if (country.all_city !== '1') {
			countryPropsClasses.push('none');
		}

		const out = `\
<li class="list-group-item country" data-country="${country.country_id}">
	<input type="hidden" name="country_id[${country.country_id}]" value="${country.country_id}" />
	<h4>
		${country.title}
		<a href="#" class="rm-country small">${bs.icon('remove')}</a>
	</h4>
	<div class="checkbox">
		<label>
			${gHtmlActive.checkbox(country, 'all_city', allCityAttrs)} ${this.getI18n().__('All cities')}
		</label>
	</div>
	<div class="${countryPropsClasses.join(' ')}">
		<div class="form-group">
			${bs.label(this.getI18n().__('Fixed rate for all cities (%s)', [locale.getCurrencySymbol()]), 'country_rate')}
			${bs.textField(country, 'rate', countryRateProps)}
		</div>
		<div class="form-group">
			${bs.label(this.getI18n().__('Delivery time'), 'delivery_time')}
			${bs.textField(country, 'delivery_time', deliveryTimeProps)}
		</div>
		${excludeCitiesHtml}
	</div>
	${citiesHtml}
</li>\
`;

		return out;
	}
*/

	/*
	renderExcludeCitiesBlock(country) {
		const emptyRow = {};
		const excludeCitySearchProps = {
			placeholder : this.getI18n().__('Add excluded city: enter name'),
			class : 'exclude-city-search'
		};

		const out = `\
<div class="exclude-cities">
	<div class="form-group">
		<label>${this.getI18n().__('Exclude cities:')}</label>
		${this.renderExcludeCitiesList(country)}
	</div>
	<div class="form-group">
		${bs.textField(emptyRow, 'exclude_city_search', excludeCitySearchProps)}
	</div>
</div>\
`;

		return out;
	}
*/

	/*
	renderExcludeCitiesList(country) {
		if (!(country.country_id in this.excludeCities)) {
			const list = this.data.excludeCities[country.country_id] || [];
			this.excludeCities[country.country_id] = new Backbone.My.Collection(list, {
				model : this.CityModel
			});
		}

		const collection = this.excludeCities[country.country_id];

		if (collection.length === 0) {
			return '';
		}

		let out = '\
<ul class="list-inline exclude-cities-list">\
';
		collection.each(model => {
			return out += `\
<li data-city="${model.get('city_id')}">
	${model.get('common_title')}
	<a href="#" class="small rm">${bs.icon('remove')}</a>
	<input type="hidden" name="exclude_city_id[${country.country_id}][${model.get('city_id')}]" value="${model.get('city_id')}" />
</li>\
`;
		});

		out += '</ul>';

		return out;
	}

	renderCitiesBlock(country) {
		const emptyRow  = {};
		const citySearchProps = {
			placeholder : this.getI18n().__('Add city: enter city name'),
			class : 'city-search'
		};

		const classes = ['cities'];
		if (country.all_city === '1') {
			classes.push('none');
		}

		const out = `\
<div class="${classes.join(' ')}">
	${this.renderCitiesList(country)}
	<div class="form-group">
		${bs.textField(emptyRow, 'city_search', citySearchProps)}
	</div>
</div>\
`;

		return out;
	}

	renderCitiesList(country) {
		const locale = this.getLocale();

		if (!(country.country_id in this.cities)) {
			const list = this.data.cities[country.country_id] || [];
			this.cities[country.country_id] = new Backbone.My.Collection(list, {
				model : this.CityModel
			});
		}

		const collection = this.cities[country.country_id];

		if (collection.length === 0) {
			return '';
		}

		let out = `\
<table class="table table-bordered table-striped">
	<tr>
		<th class="title">${this.__('City')}</th>
		<th class="rate-props">${this.__('Price')}</th>
		<th class="delivery-time">${this.__('Delivery time')}</th>
		<th class="rm"></th>
	</tr>\
`;

		collection.each(row => {
			const rateProps = {
				name : `rate[${country.country_id}][${row.get('city_id')}]`,
				placeholder: this.__('Rate (%s)', [locale.getCurrencySymbol()]),
				type: 'number',
				min: '0',
				lang: 'en',
				step: '0.01'
			};

			const deliveryTimeProps = {
				name : `delivery_time[${country.country_id}][${row.get('city_id')}]`,
				placeholder : this.getI18n().__('Delivery time')
			};

			const rowJSON = row.toJSON();

			return out += `\
<tr data-city="${row.get('city_id')}">
	<td class="title">
		${row.get('common_title')}
		${gHtml.hiddenField(`city_id[${country.country_id}][${row.get('city_id')}]`, row.get('city_id'))}
	</td>
	<td class="rate-props">
		<div class="form-group">
			${bs.textField(rowJSON, 'rate', rateProps)}
		</div>
	</td>
	<td class="delivery-time">
		<div class="form-group">
			${bs.textField(rowJSON, 'delivery_time', deliveryTimeProps)}
		</div>
	</td>
	<td class="rm">
		<a href="#" class="">
			${bs.icon('remove')}
		</a>
	</td>
</tr>\
`;
		});

		out += '</table>';

		return out;
	}*/

	getFileName() {
		return __filename;
	}
/*
	onRmCityClicked(e) {
		e.preventDefault();

		const $a = $(e.currentTarget);
		const $tr = $a.parents('tr:eq(0)');
		const $li = $a.parents('li.country:eq(0)');
		const countryId = $li.data('country');

		const collection = this.cities[countryId];
		return collection.remove(collection.get($tr.data('city')));
	}*/

	/*
	onCityPropsChanged(e) {
		const $tr = $(e.currentTarget).parents('tr:eq(0)');
		const $li = $tr.parents('li.country:eq(0)');

		const collection = this.cities[$li.data('country')];
		const model = collection.get($tr.data('city'));

		model.set('rate', $tr.find('.rate-props input').val());
		return model.set('delivery_time', $tr.find('.delivery-time input').val());
	}*/

	/*
	onRmCountryClicked(e) {
		e.preventDefault();

		return $(e.currentTarget).parents('li.country:eq(0)').remove();
	}*/

	/*
	onAddCountryClicked(e) {
		e.preventDefault();

		this.clearErrors();
		const $country = this.$('#country_search');
		const $option = $country.find('option:selected');

		if ($country.val() === '') {
			this.showError(this.$el, $country, 'country_search', [this.getI18n().__('Please, select country')]);
			return;
		}

		if (this.findCountryLi($country.val()).length !== 0) {
			this.showError(this.$el, $country, 'country_search', [this.getI18n().__('Country already in the list.')]);
			return;
		}

		this.$countries.append(this.renderCountryBlock({
			country_id : $country.val(),
			title : $option.text(),
			all_city : '1',
			country_rate : '',
			country_delivery_time : ''
		})
		);

		return this.setupCountryBlockEvents(this.findCountryLi($country.val()));
	}
*/
	/*
	findCountryLi(countryId) {
		return this.$countries.find(`li.country[data-country=\"${countryId}\"]`);
	}

	onAllCityChange(e) {
		const $input = $(e.target);
		const $country = $input.parents('li.country:eq(0)');

		const $countryProps = $country.find('.country-props');
		const $cities = $country.find('.cities');


		if ($input.is(':checked')) {
			$cities.addClass('none');
			return $countryProps.removeClass('none');
		} else {
			$cities.removeClass('none');
			return $countryProps.addClass('none');
		}
	}

	onRmExcludeCityClicked(e) {
		e.preventDefault();

		const $li = $(e.currentTarget).parents('li:eq(0)');
		const $countryLi = $li.parents('li.country:eq(0)');
		const collection = this.excludeCities[$countryLi.data('country')];

		return collection.remove([collection.get($li.data('city'))]);
	}
*/
	/*
	setupCountryBlockEvents($li) {
		const countryId = $li.data('country');

		this.setupCityAutocomplete($li, countryId);
		this.setupExcludeCityAutocomplete($li, countryId);
		return this.setupCityCollectionListeners(countryId);
	}

	setupCityCollectionListeners(countryId) {
		let collection = this.cities[countryId];
		this.listenTo(collection, 'add', () => {
			return this.reRenderCitiesList({country_id : countryId});
	});

		this.listenTo(collection, 'remove', () => {
			return this.reRenderCitiesList({country_id : countryId});
	});


		collection = this.excludeCities[countryId];
		this.listenTo(collection, 'add', () => {
			return this.reRenderExcludeCitiesList({country_id : countryId});
	});

		return this.listenTo(collection, 'remove', () => {
			return this.reRenderExcludeCitiesList({country_id : countryId});
	});
	}

	cityAutocompleteSource(countryId) {
		return (request, response) => {
			const params = {
				country : countryId,
				q : request
			};

			return ajax.get(this.url('system/city/autocomplete'), params)
			.then(data => {
				return response(autocomplete.convertResponse(request, data));
			});
		};
	}

	setupExcludeCityAutocomplete($li, countryId) {
		const citySearch = $li.find('.exclude-city-search');
		citySearch.autocomplete({
			forceFixPosition: true,
			appendTo: '.modal-body',
			onSelect: result => {
				const collection = this.excludeCities[countryId];
				if (!collection.get(result.data.id)) {
					collection.add([
						{
							city_id : result.data.id,
							common_title : result.data.label
						}
					]);
				}

				return citySearch.val('');
			},

			lookup : this.cityAutocompleteSource(countryId),
			minChars : 2
		});

		return this.autocompleteEls.push(citySearch);
	}

	setupCityAutocomplete($li, countryId) {
		const citySearch = $li.find('.city-search');
		citySearch.autocomplete({
			forceFixPosition: true,
			appendTo : '.modal-body',
			onSelect : result => {
				const collection = this.cities[countryId];
				if (!collection.get(result.data.id)) {
					collection.add([
						{
							city_id : result.data.id,
							common_title : result.data.label,
							rate : '',
							delivery_time : ''
						}
					]);
				}

				return citySearch.val('');
			},

			lookup : this.cityAutocompleteSource(countryId),
			minChars : 2
		});

		return this.autocompleteEls.push(citySearch);
	}

	reRenderExcludeCitiesList(country) {
		const $countryLi = this.findCountryLi(country.country_id);
		const $ul = $countryLi.find('.exclude-cities .exclude-cities-list');
		const collection = this.excludeCities[country.country_id];

		if (collection.length === 0) {
			$ul.remove();
			return;
		}

		const html = this.renderExcludeCitiesList(country);

		if ($ul.length > 0) {
			return $ul.replaceWith(html);
		} else {
			return $countryLi.find('.exclude-cities .form-group:eq(0)').append(html);
		}
	}

	reRenderCitiesList(country) {
		const $li = this.findCountryLi(country.country_id);
		const $tbl = $li.find('.cities > table');
		const collection = this.cities[country.country_id];

		if (collection.length === 0) {
			$tbl.remove();
			return;
		}

		const html = this.renderCitiesList(country);

		if ($tbl.length > 0) {
			return $tbl.replaceWith(html);
		} else {
			return $li.find('.cities').prepend(html);
		}
	}

	isCityInList(countryId, cityId) {
		if (!_.isArray(this.data.cities[countryId])) {
			return false;
		}

		for (let city of Array.from(this.data.cities[countryId])) {
			if (city.city_id === cityId) {
				return true;
			}
		}

		return false;
	}*/
/*
	processErrorResult(data) {
		this.setupFormEls();

		return super.processErrorResult(...arguments);
	}*/

/*
	setupFormEls() {
		super.setupFormEls(...arguments);

		delete this.formEls.all_city;
		delete this.formEls.country_id;
		delete this.formEls.city_id;
		delete this.formEls.rate;
		delete this.formEls.delivery_time;
		delete this.formEls.country_rate;
		delete this.formEls.country_delivery_time;

		return this.$el.find('[name]:input').each((key, val) => {
			const $el = $(val);

			const result = /^(all_city|country_id|city_id|rate|delivery_time|country_rate|country_delivery_time)/.exec($el.attr('name'));
			if (result != null) {
				return this.formEls[$el.attr('name')] = $el;
			}
		});
	}

	onEdostProviderChange(e) {
		const providerAlias = this.findEdostProviderAliasById( this.$(e.currentTarget).val() );

		switch (providerAlias) {
			case 'customSelfPickup':
				this.$el.find('.tariff-list.courier').hide();
				return this.$el.find('.tariff-list.pickup').show();
			case 'customCourier':
				this.$el.find('.tariff-list.pickup').hide();
				return this.$el.find('.tariff-list.courier').show();
			default:
				this.$el.find('.tariff-list').hide();
				return;
		}
	}

	findEdostProviderAliasById(id) {
		for (let provider of Array.from(this.data.options.edostProviders)) {
			if (Number(provider[0]) === Number(id)) {
				return provider[2];
			}
		}
	}*/

	remove() {
		this.cities = null;
		this.excludeCities = null;

		for (const $el of this.autocompleteEls) {
			$el.autocomplete('dispose').remove();
		}

		this.dropZone.remove();

		return super.remove();
	}
}
