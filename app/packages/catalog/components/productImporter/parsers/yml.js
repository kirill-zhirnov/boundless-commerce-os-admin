import Q from 'q';
import fs from 'fs';
import xml2js from 'xml2js';
import _ from 'underscore';
import {XmlEntities} from 'html-entities';
const entities = new XmlEntities();
import validator from '../../../../../modules/validator/validator';
import {Iconv} from 'iconv';
import sax from 'sax';

export default class ProductImportParserYml {
	constructor(filePath, settings = {}) {
		this.filePath = filePath;
		this.settings = settings;
		this.data = null;
		this.rowsNumber = null;
		this.currentRow = 1;
	}

	async parse(saveRowCb) {
		await this.loadFile();
		await this.processCategories(saveRowCb);
		await this.processOffers(saveRowCb);
	}

	async loadFile() {
		let parser = null;
		try {
			const result = fs.readFileSync(this.filePath);
			const content = await this.convertXMLToUtf8(result);
			parser = new xml2js.Parser({
				trim: true,
				explicitArray: false
			});

			const data = await parser.parseString(content);
			if ((data['yml_catalog'] != null ? data['yml_catalog']['shop'] : undefined) != null) {
				this.data = data['yml_catalog']['shop'];
			} else {
				throw new Error('Wrong YML format: yml_catalog or shop not found');
			}
		} catch (e) {
			//@ts-ignore
			e.resolve = true;
			throw e;
		}
	}

	async processCategories(saveRowCb) {
		if ((this.data['categories'] == null) || !_.isArray(this.data['categories']['category'])) {
			return;
		}

		for (const category of Array.from(this.data['categories']['category'])) {
			await saveRowCb(this.extractCategoryData(category));
		}
	}

	extractCategoryData(row) {
		const out = {
			'!essence': 'category',
			category: row._,
			external_category_id: row['$'].id
		};

		if (row['$'].parentId) {
			out.external_parent_id = row['$'].parentId;
		}

		return out;
	}

	async processOffers(saveRowCb) {
		if ((this.data['offers'] == null) || !_.isArray(this.data['offers']['offer'])) {
			return;
		}

		for (const offer of Array.from(this.data['offers']['offer'])) {
			await saveRowCb(this.extractOfferData(offer));
		}
	}

	extractOfferData(row) {
		//		'basic' is for "simplified" type: https://yandex.ru/support/partnermarket/offers.html
		let inStock;
		let type = 'basic';
		if ((row['$'].type === 'vendor.model') && row.model && row.vendor) {
			//			type: https://yandex.ru/support/partnermarket/export/vendor-model.html
			type = 'vendorModel';
		}

		const out = {
			external_id: row['$'].id,
			external_category_id: row['categoryId']
		};

		switch (type) {
			case 'basic':
				out.name = entities.decode(row['name']);
				break;

			case 'vendorModel':
				out.name = entities.decode(row['model']);
				break;
		}

		if (row.$.group_id) {
			out.offerGroupId = row.$.group_id;
		}

		if (this.settings.priceKey) {
			if (row.price) {
				out[this.settings.priceKey] = row.price;
			}

			if (row.oldprice) {
				out[`${this.settings.priceKey}_old`] = row.oldprice;
			}
		}

		if (row['picture']) {
			const images = [];
			if (!Array.isArray(row['picture'])) {
				row['picture'] = [row['picture']];
			}

			for (let pictureItem of Array.from(row['picture'])) {
				let pictureUrl = pictureItem;
				if (_.isObject(pictureItem)) {
					if (pictureItem._) {
						pictureUrl = pictureItem._;
					} else if ((pictureItem.$ != null ? pictureItem.$.url : undefined) != null) {
						pictureUrl = pictureItem.$.url;
					}
				}

				images.push({
					src: entities.decode(pictureUrl)
				});
			}

			if (images.length > 0) {
				out.images = images;
			}
		}

		if (row['description']) {
			out.description = entities.decode(row['description']);
		}

		if (row['vendor']) {
			out.manufacturer = entities.decode(row['vendor']);
		}

		if (row['typePrefix']) {
			out.commodity_group = entities.decode(row['typePrefix']);
		}

		if (row['vendorCode']) {
			out.sku = entities.decode(row['vendorCode']);
		}

		if (row['param']) {
			const params = [];
			if (!Array.isArray(row['param'])) {
				row['param'] = [row['param']];
			}

			for (let i = 0; i < row['param'].length; i++) {
				const paramItem = row['param'][i];
				if (!paramItem._ || ((paramItem.$ != null ? paramItem.$.name : undefined) == null)) {
					continue;
				}

				const paramName = validator.trim(paramItem.$.name);
				const paramVal = validator.trim(paramItem._);

				if (!paramName || !paramVal) {
					continue;
				}

				params.push({
					name: paramName,
					value: entities.decode(paramVal)
				});
			}

			if (params.length > 0) {
				out.params = params;
			}
		}

		if (row['$'].available) {
			inStock = String(row['$'].available).toLowerCase();
			out.inStock = inStock === 'true' ? true : false;
		} else if (row['instock']) {
			inStock = String(entities.decode(row['instock'])).toLowerCase();
			out.inStock = inStock === 'да' ? true : false;
		}

		return out;
	}

	convertXMLToUtf8(content) {
		let encoding = null;
		return new Promise((resolve, reject) => {
			const saxParser = sax.parser(true, {
				trim: true,
				normalize: true,
			});

			saxParser.onprocessinginstruction = val => {
				if (val && val.body) {
					encoding = this.detectEncoding(val.body);
				}
			};

			saxParser.onend = () => resolve();

			saxParser.onerror = e => reject(e);

			saxParser.write(content).close();
		})
			.then(() => {
				if (encoding && (encoding !== 'UTF-8')) {
					const iconv = new Iconv(encoding, 'UTF-8');
					content = iconv.convert(content).toString();
				}

				return content;
			});
	}

	detectEncoding(xmlDefinition) {
		const res = /encoding=("|')([^"']+)("|')/i.exec(xmlDefinition);
		if (!res) {
			return null;
		}

		let encoding = res[2].toUpperCase();
		switch (encoding) {
			case 'WINDOWS-1251':
				encoding = 'CP1251';
				break;

			case 'UTF8':
				encoding = 'UTF-8';
				break;
		}

		return encoding;
	}
}