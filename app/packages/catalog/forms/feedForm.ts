import BasicForm from '../../../modules/form/index';
import {IFeeds, TFeedType} from '../../../@types/catalog';
import {IFeedsModel, IFeedsModelStatic} from '../models/feeds';
import {ICountryModelStatic} from '../../delivery/models/country';
import {ICommodityGroupModelStatic} from '../models/commodityGroup';
import {ICollectionModelStatic} from '../models/collection';
import {isNumber} from 'underscore';
import randomString from 'random-string';
import validator from '../../../modules/validator/validator';

interface  IAttrs {
	title: string;
	type: TFeedType;
	shop_url: string;
	product_url_template: string;
	shop_title?: string;
	shop_description?: string;
	is_protected: string;
	collection?: number;
	commodity_group?: number;
	manufacturer?: number;
	categories?: number[];
}

export default class FeedForm extends BasicForm<IAttrs, IFeedsModel> {
	getRules() {
		return [
			['title, type, shop_url, product_url_template', 'required'],
			['type', 'inOptions', {options: [[TFeedType.googleShopping], [TFeedType.facebook]]}],
			['is_protected', 'safe'],
			['categories', 'categoriesValidate'],
			['collection', 'inOptions', {options: 'collection'}],
			['commodity_group', 'inOptions', {options: 'commodityGroup'}],
			['manufacturer', 'inOptions', {options: 'manufacturer'}],
			['shop_url', 'isURL', {require_protocol: true}],
			['shop_title,shop_description', 'validatorRequiredIfGoogle']
		];
	}

	categoriesValidate(value: unknown, options, field: string) {
		if (Array.isArray(value) && (value as unknown[]).every(isNumber)) {
			this.addError(field, 'invalidCategories', this.__('Invalid categories'));
		}
	}

	async setupAttrs() {
		await super.setupAttrs();

		if (!this.attributes.product_url_template) {
			this.attributes.product_url_template = '/product/{product_slug}';
		}
	}

	async loadRecord() {
		const row = await (this.getModel('feeds') as IFeedsModelStatic).findException({
			where: {
				feed_id: this.pk
			}
		}) as IFeedsModel;

		return row;
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON() as IFeeds;
		this.setAttributes({...row, ...row.conditions, ...row.data});
	}

	async save() {
		if (!this.record) {
			this.record = (this.getModel('feeds') as IFeedsModelStatic).build();
		}

		//eslint-disable-next-line
		let {title, type, is_protected, collection, commodity_group, manufacturer, categories, shop_url, product_url_template, shop_title, shop_description} = this.getSafeAttrs();

		let protection = null;
		if (is_protected) {
			const oldProtection = this.record.is_protected;
			protection = oldProtection ? oldProtection : await this.generateProtectionData();
		}

		collection = collection ? parseInt(String(collection)) : null;
		commodity_group = commodity_group ? parseInt(String(commodity_group)) : null;
		manufacturer = manufacturer ? parseInt(String(manufacturer)) : null;
		categories = Array.isArray(categories) ? categories.map(id => parseInt(String(id))) : [];

		shop_url = validator.trim(shop_url, '/');

		const data = {
			...this.record.data,
			shop_url,
			product_url_template,
			shop_title,
			shop_description
		};

		this.record.set({
			title,
			type,
			conditions: {
				collection, commodity_group, manufacturer, categories
			},
			data,
			is_protected: protection,
		});
		await this.record.save();
	}
	async generateProtectionData() {
		return {
			login: randomString({
				length: 7,
				numeric: true,
				letters: true,
				special: false
			}),
			pass: randomString({
				length: 7,
				numeric: true,
				letters: true,
				special: false
			})
		};
	}
	rawOptions() {
		return Object.assign(super.rawOptions(), {
			country: (this.getModel('country') as ICountryModelStatic).findCountryOptions(this.getEditingLang().lang_id, [['', this.__('All countries')]]),
			commodityGroup: (this.getModel('commodityGroup') as ICommodityGroupModelStatic).fetchOptions(this.getEditingLang().lang_id, [['', this.__('All')]]),
			collection: (this.getModel('collection') as ICollectionModelStatic).fetchOptions(this.getEditingSite().site_id, this.getEditingLang().lang_id, [['', this.__('All')]]),
			//@ts-ignore
			manufacturer: this.getModel('manufacturer').findOptions(this.getEditingLang().lang_id, [['', this.__('All')]])
		});
	}

	validatorRequiredIfGoogle(value: unknown, options, field: string) {
		value = validator.trim(String(value));

		if (this.attributes.type == TFeedType.googleShopping && value == '') {
			this.addError(field, 'required', this.__('Value cannot be blank.'));
		}
	}
}