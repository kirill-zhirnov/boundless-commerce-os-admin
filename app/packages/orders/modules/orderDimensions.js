// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const _ = require('underscore');
const moolah = require('moolah');
const packer = require('3d-bin-packing');
const {parseString} = require('xml2js');

class OrderDimensions {
	constructor(instanceRegistry, deliverySettings, langId) {
		this.instanceRegistry = instanceRegistry;
		this.deliverySettings = deliverySettings;
		this.langId = langId;
		this.boxArray = null;
		this.productArray = null;
	}

	loadDeliverySettings() {
		return this.instanceRegistry.getSettings().get('delivery', 'settings')
		.then(deliverySettings => {
			this.deliverySettings = deliverySettings;

		});
	}

	getCharacteristics(productIds, variantIds, transition) {
		let rows = null;

		return this.instanceRegistry.getDb().sql(`\
select \
'product' as type, \
product_id as id, \
size \
from \
product_prop \
where \
product_id in (:productIds) \
union \
select \
'variant' as type, \
variant_id as id, \
size \
from \
variant \
where \
variant_id in (:variantIds)\
`, {
			productIds,
			variantIds
		})
		.then(res => {
			rows = res;

			if ((this.deliverySettings == null)) {
				return this.loadDeliverySettings();
			}
	}).then(() => {
			const defaultValues = _.extend({
				weight: this.deliverySettings.defaultProductWeight
			}, this.deliverySettings.defaultProductDimensions);

			const out = {
				products: {},
				variants: {},
				default: defaultValues
			};

			for (let row of Array.from(rows)) {
				if (row.type === 'product') {
					out.products[row.id] = row.size;
				} else {
					out.variants[row.id] = row.size;
				}
			}

			return out;
		});
	}

	parseItems(items) {
		const out = {
			productIds: [],
			variantIds: []
		};

		for (let item of Array.from(items)) {
			out.variantIds.push(item.variant_id);
			out.productIds.push(item.product_id);
		}

		return out;
	}

	assembleCharacteristics(items, characteristics) {
		const deferred = Q.defer();

		const total = { weight: 0 };
		let itemsNumber = 0;

		for (let item of Array.from(items)) {
			itemsNumber += item.qty;

			item.dimensions = _.extend(
				{},
				characteristics.default,
				characteristics.products[item.product_id],
				characteristics.variants[item.variant_id]
			);

			const weight = this.prepareDimensionNumber(item.dimensions.weight, 0);

			const sumWeight = moolah(weight).times(item.qty).float();
			total.weight = moolah(total.weight).plus(sumWeight).float();

			if (this.deliverySettings.useDimensions) {
				const width = this.prepareDimensionNumber(item.dimensions.width);
				const height = this.prepareDimensionNumber(item.dimensions.height);
				const length = this.prepareDimensionNumber(item.dimensions.length);

				this.productArray.insert(
					this.productArray.end(), item.qty, new packer.Product(
						item.item_id,
						width,
						height,
						length
					)
				);
			}
		}

		Q()
		.then(() => {
			if (this.deliverySettings.useDimensions) {
				return this.pack(itemsNumber);
			} else {
				return {
					packResult: false
				};
			}
	})
		.then(out => {
			_.extend(total, out);

			return deferred.resolve({
				items,
				total
			});
	})
		.catch(function(e) {
			console.error("catched packing err", e);
			return deferred.reject(e);}).done();

		return deferred.promise;
	}

	prepareDimensionNumber(numberStr, defaultVal) {
		if (defaultVal == null) { defaultVal = 1; }
		numberStr = String(numberStr);
		numberStr = numberStr.replace(',', '.');

		numberStr = Number(numberStr);

		if (isNaN(numberStr) || (numberStr <= 0)) {
			numberStr = defaultVal;
		}

		return numberStr;
	}

	calcOrderDimensions(items) {
		if (items.length === 0) {
			return Q({
				items,
				total: this.getDefaultResult()
			});
		}

		let characteristics = null;

		this.resetBoxProducts();
		const data = this.parseItems(items);

		return this.getCharacteristics(data.productIds, data.variantIds, data.transition)
		.then(res => {
			characteristics = res;

			if (this.deliverySettings.useDimensions && (this.boxArray == null)) {
				return this.preparePacker();
			}
	}).then(() => {
			return this.assembleCharacteristics(items, characteristics);
			}).then(out => {
			return out;
		});
	}

	getBoxes() {
		return this.instanceRegistry.getDb().sql(`\
select \
box.*, \
box_text.title, \
length+width+height as sum_dim \
from \
box \
inner join box_text using (box_id) \
where \
lang_id = :lang \
and deleted_at is null \
order by \
sum_dim asc\
`, {
			lang: this.langId
		})
		.then(rows => {
			return rows;
		});
	}

	preparePacker() {
		return this.getBoxes()
		.then(boxes => {
			if (boxes.length !== 0) {
				this.boxArray = new packer.WrapperArray();

				for (let box of Array.from(boxes)) {
					this.boxArray.push(
						new packer.Wrapper(`${box.box_id}. ${box.title}`, 0, Number(box.width), Number(box.height), Number(box.length), 0)
					);
				}
			}

		});
	}

	resetBoxProducts() {
		this.productArray = new packer.InstanceArray();
	}

	pack(itemsNumber) {
		const out = this.getDefaultResult();

		if (!this.boxArray) {
			return Q(out);
		}

		const deferred = Q.defer();

		Q()
		.then(() => {
			const myPacker = new packer.Packer(this.boxArray, this.productArray);
			const res = myPacker.optimize();

			return Q.nfcall(parseString, res.toXML().toString());
	}).then(xmlObj => {
			const boxes = xmlObj.wrapperArray.instance;
			let packedItems = 0;

			for (let box of Array.from(boxes)) {
				packedItems += box.wrap.length;

				const area = moolah( Number(box.$.width) ).times( Number(box.$.length) ).float();

				if (area > out.area) {
					out.width = Number(box.$.width);
					out.length = Number(box.$.length);
					out.area = area;
				}

				out.boxIds.push(parseInt(box.$.name));
				out.height += Number(box.$.height);
			}

			// check if all items fit boxes
			if (itemsNumber === packedItems) {
				out.packResult = true;
			}

			return deferred.resolve(out);
		}).catch(e => {
			let logError = true;

			const skipOnErrors = [
				'All instances are greater than the wrapper.'
			];

			if (e && (skipOnErrors.indexOf(e.message) !== -1)) {
				logError = false;
			}

			if (logError) {
				console.error(e);
			}

			return deferred.resolve(out);
		}).done();

		return deferred.promise;
	}

	getDefaultResult() {
		return {
			packResult: false,
			boxIds: [],
			height: 0,
			width: 0,
			length: 0,
			area: 0
		};
	}
}

module.exports = OrderDimensions;
