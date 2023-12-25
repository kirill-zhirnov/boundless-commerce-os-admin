import Form from '../../../modules/form/index';
import _ from 'underscore';

export default class SemanticMarkup extends Form {
	getRules() {
		return [
			['name, show, country, region, city, postalCode, street, priceRange', 'safe'],
			['email', 'email'],
			['telephone', 'isPhoneNumber'],
			['lat, long', 'isDotNumeric']
		];
	}

	async setup() {
		await super.setup();
		const value = await this.getInstanceRegistry().getSettings().get('cms', 'semanticMarkup');

		const attrs = _.pick(value, ['name', 'telephone', 'email', 'show', 'images', 'priceRange']);
		_.extend(attrs, value.address, value.geo);

		if (Array.isArray(attrs.images)) {
			attrs.images = attrs.images.map(img => {
				return this.getInstanceRegistry().getMediaUrl(img);
			});
		}

		this.attributes = attrs;
	}

	async save() {
		const settingVal = await this.getInstanceRegistry().getSettings().get('cms', 'semanticMarkup');

		const attrs = this.getSafeAttrs();

		const data = _.pick(attrs, ['name', 'telephone', 'email', 'priceRange']);
		//@ts-ignore
		data.address = _.pick(attrs, ['country', 'region', 'city', 'postalCode', 'street']);
		//@ts-ignore
		data.geo = _.pick(attrs, ['lat', 'long']);
		//@ts-ignore
		data.show = attrs.show ? true : false;

		Object.assign(settingVal, data);

		await this.getInstanceRegistry().getSettings().set('cms', 'semanticMarkup', settingVal);
	}
}