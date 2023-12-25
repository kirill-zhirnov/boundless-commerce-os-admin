// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Form = pathAlias('@modules/form/index');
const Q = require('q');
const _ = require('underscore');

class Option extends Form {
	constructor(options) {
		if (options == null) { options = {}; }
		super(...arguments);

		this.category = options.category;

		if (!this.category) {
			throw new Error("You must set category!");
		}
	}

	getRules() {
		return [
			['title', 'required'],
			['alias', 'isUnique', {
				field : 'alias',
				row : this.record,
				model : this.getModel('inventoryOption'),
				criteria : {
					where : {
						category : this.category
					}
				}
			}],
			['sort', 'isNum']
		];
	}

	loadRecord() {
		return this.getModel('inventoryOption').findException({
			include: [{
				model: this.getModel('inventoryOptionText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				option_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['alias', 'sort']));

		_.extend(attrs, _.pick(row.inventoryOptionTexts[0], [
			'title'
		])
		);

		return this.setAttributes(attrs);
	}

	save() {
		const deferred = Q.defer();

		const attrs = this.getSafeAttrs();

		let row = null;

		this.getRecord()
		.then(record => {
			if (record) {
				row = record;
				row.sort = attrs.sort;
			} else {
				row = this.getModel('inventoryOption').build();
				row.category = this.category;
			}

			row.alias = attrs.alias;

			return row.save();
	}).then(() => {
			this.pk = row.option_id;

			return this.findTextModel('inventoryOptionText', {
				option_id: row.option_id,
				lang_id: this.getEditingLang().lang_id
			});
		})
		.then(text => {
			text.set({
				title: attrs.title
			});
			return text.save();
	}).then(() => {
			return deferred.resolve();
		}).done();

		return deferred.promise;
	}

	getTplData() {
		const deferred = Q.defer();

		super.getTplData(...arguments)
		.then(data => {
			data.action = this.url(`inventory/admin/option/${this.category}/form`);

			return deferred.resolve(data);
	}).done();

		return deferred.promise;
	}
}

module.exports = Option;
