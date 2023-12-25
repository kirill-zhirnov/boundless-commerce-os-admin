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
const pathAlias = require('path-alias');
const registry = pathAlias('@registry');

class TypeArea {

//	essence - used to mark uploaded images as "used_in". If image was uploaded for essence "page",
//	it will be marked as used_in : ['page'].

	constructor(options) {
		({typeAreaId: this.typeAreaId, prefix: this.prefix, form: this.form, trx: this.trx, essence: this.essence} = options);

		if (!this.prefix) {
			this.prefix = '';
		}

		if (this.form) {
			this.i18n = this.form.controller.getI18n();
		}

		this.blocks = null;
		this.typeArea = null;
		this.notRemoveBlockId = [];

		this.db = registry.getDb();
	}

	getTplData() {
		const deferred = Q.defer();

		Q.all([this.getBlocks()])
		.then(result => {
			const [blocks] = Array.from(result);

			return deferred.resolve({
				blocks,
				types : this.getTypes(),
				prefix : this.prefix,
				essence : this.essence
			});
	})
		.done();

		return deferred.promise;
	}

	validate() {
		this.validateRequiredFields();

		return true;
	}

	save() {
		const deferred = Q.defer();

		this.createTypeArea()
		.then(() => {
			return this.saveBlocks();
	}).then(() => {
			return deferred.resolve(this.typeArea);
		}).done();

		return deferred.promise;
	}

	saveBlocks() {
		const deferred = Q.defer();

		this.notRemoveBlockId = [];

		const TypeareaBlock = this.db.model('typeareaBlock');

		const funcs = [];
		const object = this.getValues();
		for (let key in object) {
			const block = object[key];
			const f = ((key, block) => {
				return () => {
					const deferredItem = Q.defer();

					Q()
					.then(() => {
						if (!this.isNewKey(key)) {
							return TypeareaBlock.find({
								where : {
									block_id : key,
									typearea_id : this.typeArea.typearea_id
								},
								transaction : this.trx
							});
						}
				})
					.then(row => {
						if (!row) {
							row = TypeareaBlock.build().set({
								typearea_id : this.typeArea.typearea_id,
								type : block.type
							});
						}

						const sort = block.position * 10;

						return row.set({
							noindex : block.noindex === '1' ? true : false,
							sort : isNaN(sort) ? null : sort
						})
						.save({transaction : this.trx});
				}).then(row => {
						this.notRemoveBlockId.push(row.block_id);

						return this.saveBlockByType(row, block);
					}).then(() => {
						return deferredItem.resolve();
					}).done();

					return deferredItem.promise;
				};
			}
			)(key, block);

			funcs.push(f);
		}

		let result = Q();
		funcs.forEach(f => result = result.then(f));

		result
		.then(() => {
			const where =
				{typearea_id : this.typeArea.typearea_id};

			if (this.notRemoveBlockId.length > 0) {
				where.block_id =
					{$notIn : this.notRemoveBlockId};
			}

			return TypeareaBlock.update({
				deleted_at : this.db.fn('now')
			}, {
				where
			});
	})
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}

	saveBlockByType(row, block) {
		const deferred = Q.defer();

		Q()
		.then(() => {
			switch (row.type) {
				case "text":
					return this.db.model('typeareaBlockText').update({
						value : block.value
					}, {
						where : {
							block_id : row.block_id
						},
						transaction : this.trx
					});
			}
	})
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}

	createTypeArea() {
		const deferred = Q.defer();

		const Typearea = this.db.model('typearea');

		Q()
		.then(() => {
			if (this.typeAreaId != null) {
				return Typearea.find({
					where : {
						typearea_id : this.typeAreaId
					},
					transaction : this.trx
				});
			} else {
				return Typearea.build().save({transaction : this.trx});
			}
	}).then(row => {
			if (!row) {
				throw new Error(`Cannot find typearea with id='${this.typeAreaId}'`);
			}

			this.typeArea = row;

			return deferred.resolve();
			}).done();

		return deferred.promise;
	}

	getBlocks() {
		if (this.blocks != null) {
			return this.blocks;
		}

		const deferred = Q.defer();

		this.db.sql(`\
select \
block_id, \
type, \
noindex::int::text, \
txt.value as text_value, \
row_number() over() as position \
from \
typearea_block \
inner join typearea_block_text txt using(block_id) \
where \
typearea_id = :typeAreaId \
and deleted_at is null \
order by \
sort asc\
`, {
			typeAreaId : this.typeAreaId
		})
		.then(rows => {
			this.blocks = rows;

			if (!this.blocks.length && this.form) {
				this.blocks.push({
					block_id : 'new_0',
					type : 'text',
					position : 1
				});
			}

			return deferred.resolve(this.blocks);
	}).done();

		return deferred.promise;
	}

	getTypes() {
		return ['text'];
	}

	isNewKey(key) {
		if (/^new_/.test(key)) {
			return true;
		}

		return false;
	}

	getValues() {
		const key = this.getNamePrefix();
		if (key in this.form.attributes) {
			const values = this.form.attributes[key];

			if ('__tmp' in values) {
				delete values['__tmp'];
			}

			return values;
		}

		return {};
	}

	getNamePrefix() {
		return `typearea_${this.prefix}`;
	}

	validateRequiredFields() {
		return (() => {
			const result = [];
			const object = this.getValues();
			for (let key in object) {

				const block = object[key];
				const name = `${this.getNamePrefix()}[${key}]`;

				if (!('type' in block) || !('position' in block)) {
					this.form.addError(name, 'incorrectRow', this.i18n.__('Row is incorrect'));
					continue;
				}

				switch (block.type) {
					case "text":
						if (!('value' in block)) {
							result.push(this.form.addError(name, 'incorrectRow', this.i18n.__('Row is incorrect')));
						} else {
							result.push(undefined);
						}
						break;

					default:
						result.push(this.form.addError(name, 'unknownBlockType', this.i18n.__('Unknown block type')));
				}
			}
			return result;
		})();
	}
}

module.exports = TypeArea;