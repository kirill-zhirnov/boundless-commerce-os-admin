const pathAlias = require('path-alias');
const BasicProductForm = require('../basic');
const editingProductChooser = pathAlias('@p-catalog/modules/editingProductChooser');
const errors = pathAlias('@errors');
const _ = require('underscore');

class SimpleProductForm extends BasicProductForm {
	constructor(options) {
		super(options);

		this.collectionId = options.collection;
	}

	getRules() {
		return [
			['title', 'required'],
			['is_published', 'safe'],
		];
	}

	async save() {
		let attrs = this.getSafeAttrs();

		await this.getRecord();
		this.record.set({
			status: (attrs.is_published == '1') ? 'published' : 'hidden'
		});
		await this.record.save();

		await this.getModel('collectionProductRel').addOnce(
			this.collectionId,
			this.record.product_id
		);

		await this.getModel('productText').update({
			title: attrs.title
		}, {
			where: {
				product_id: this.record.product_id,
				lang_id: this.getEditingLang().lang_id
			}
		});
	}

	async setup() {
		if (!this.collectionId)
			throw new Error("CollectionId have to be passed!");

		if (!this.pk) {
			let res = await editingProductChooser.get(this.getController(), this.getUser().getId());
			this.pk = res.id;
		}

		await super.setup();
	}

	setupAttrsByRecord() {
		let attrs = {
			is_published: (['published', 'draft'].indexOf(this.record.status) != -1) ? '1' : ''
		};

		Object.assign(attrs, _.pick(this.record.productTexts[0], [
			'title',
		]));

		this.setAttributes(attrs);
	}

	setupChildFormKit(childFormKit) {
		childFormKit.setPk(this.pk);
		childFormKit.setOptions({
			record: this.record
		});

	}

	async getTplData() {
		let out = await super.getTplData();

		Object.assign(out, {
			collectionId: this.collectionId,
			hasVariants: this.record.has_variants,
			commodityGroup: this.getCommodityGroupSettings(),
		});

		return out;
	}
}

module.exports = SimpleProductForm;