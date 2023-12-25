// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const _ = require('underscore');

class VariantsCreator {
	/**
		@characteristics - Array, which will be used for variant creation.
		[
			{
				id: characteristic_id,
				title: 'characteristic title',
				option: [
					[caseId, caseTitle]
				]
			},
    		...
		]
	*/
	constructor(characteristics, product, db, langId, trx = null) {
		this.characteristics = characteristics;
		this.product = product;
		this.db = db;
		this.langId = langId;
		this.trx = trx;
		this.funcs = [];
	}

	create() {
		this.makeVariants(this.characteristics);

		let result = Q();
		this.funcs.forEach(f => result = result.then(f));

		return result;
	}

	makeVariants(characteristics, globalCases) {
		if (globalCases == null) { globalCases = []; }
		const characteristic = characteristics[0];

		return (() => {
			const result = [];
			for (let itemCase of Array.from(characteristic.option)) {
				const item = {
					characteristic_id : characteristic.id,
					option : itemCase
				};

				const localCases = _.map(globalCases, _.clone).concat(item);
				if (characteristics[1]) {
					const next = characteristics.slice(1);
					result.push(this.makeVariants(next, localCases));
				} else {
					const f = (localCases => {
						return () => {
							return this.makeVariantRow(localCases);
						};
					}
					)(localCases);
					result.push(this.funcs.push(f));
				}
			}
			return result;
		})();
	}

	/**
	cases - Array, with characteristic and cases:
	[
		{
			characteristic_id: characteristicId,
			option : [caseId, caseTitle]
		},
		...
	]

    Returns a Promise, which resolves with variantId
	*/
	makeVariantRow(cases, saveCharacteristicsRel) {
		if (saveCharacteristicsRel == null) { saveCharacteristicsRel = false; }
		let variant = null;
		let variantId = null;

		return this.findVariantRowByCases(cases)
		.then(row => {
			if (row) {
				variant = row;
				if (row.deleted_at) {
					return this.db.model('variant').recover({
						where : {
							variant_id : row.variant_id
						},
						transaction : this.trx
					});
				}
			} else {
				return this.createVariantRow(cases);
			}
	}).then(res => {
			variantId = null;

			if (res && res.variant_id) {
				variantId = res.variant_id;
			} else {
				variantId = variant.variant_id;
			}

			if (saveCharacteristicsRel) {
				return this.saveCharacteristicsRel(cases);
			}
			}).then(() => variantId);
	}

	createVariantRow(cases) {
		const meta = this.createVariantMeta(cases);

		return Q(this.db.model('variant').find({
			where : {
				product_id: this.product.product_id,
				sku: meta.sku
			},
			transaction : this.trx
		}))
		.then(row => {
			if (row) {
				return row;
			} else {
				return this.buildVariantRow(meta, cases);
			}
		});
	}

	buildVariantRow(meta, cases) {
		const VariantValModel = this.db.model('characteristicVariantVal');
		const VariantModel = this.db.model('variant');

		const variant = VariantModel.build();
		variant.set({
			product_id : this.product.product_id,
			sku : meta.sku
		});

		return Q(variant.save({transaction : this.trx}))
		.then(() => {
			return this.db.model('variantText').update({
				title : meta.title
			}, {
				where : {
					variant_id : variant.variant_id,
					lang_id : this.langId
				},
				transaction : this.trx
			});
	})
		.then(() => {
			const funcs = [];
			for (let item of Array.from(cases)) {
				const f = (item => {
					return () => {
						const row = VariantValModel.build();
						row.set({
							variant_id : variant.variant_id,
							characteristic_id : item.characteristic_id,
							case_id : item.option[0],
							rel_type : 'variant'
						});
						return row.save({transaction : this.trx});
					};
				}
				)(item);
				funcs.push(f);
			}

			let result = Q();
			funcs.forEach(f => result = result.then(f));

			return result;
	}).then(() => {
			return variant;
		});
	}

	createVariantMeta(cases) {
		const sku = [];
		if (this.product.sku != null) {
			sku.push(this.product.sku);
		}

		const title = [];
		for (let item of Array.from(cases)) {
			sku.push(item.option[1]);
			title.push(item.option[1]);
		}

		return {
			sku : sku.join('-'),
			title : title.join('-')
		};
	}

	findVariantRowByCases(cases) {
		const casesForSearch = [];
		for (let i = 0; i < cases.length; i++) {
			const item = cases[i];
			casesForSearch.push(item.option[0]);
		}

		return this.db.model('variant').findVariantByCases(this.product.product_id, casesForSearch, {
			transaction : this.trx
		});
	}

	/**
	Cases - see @makeVariantRow method.
	*/
	saveCharacteristicsRel(cases) {
		let f = Q();
		cases.forEach(row => {
			return f = f.then(() => {
				return this.db.sql(`\
insert into product_variant_characteristic \
(product_id, characteristic_id, rel_type) \
values \
(:product, :charact, :type) \
on conflict \
do nothing\
`, {
					product: this.product.product_id,
					charact: row.characteristic_id,
					type: 'variant'
				});
			});
		});

		return f;
	}
}

module.exports = VariantsCreator;
