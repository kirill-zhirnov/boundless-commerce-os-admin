import Form from '../../../../modules/form/index';

export default class ProductImgForm extends Form {
	getRules() {
		return [
			['description, alt', 'trim'],
			['tags, tag_ids, tag_titles, variants', 'safe']
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();
		['description', 'alt'].forEach((field) => {
			if (attrs[field] == '')
				attrs[field] = null;
		});

		await this.getDb().sql(`
			update
				product_image_text
			set
				description = :description,
				alt = :alt
			where
				product_image_id = :id
		`, {
			//@ts-ignore
			id: this.record.product_image_id,
			//@ts-ignore
			description: attrs.description,
			//@ts-ignore
			alt: attrs.alt
		});

		await this.saveTags();
		await this.saveVariants();
	}

	//@ts-ignore
	async loadRecord() {
		const [row] = await this.getDb().sql(`
			select
				image.*,
				product_image.*,
				product_image_text.description,
				product_image_text.alt
			from
				product_image
				inner join image using(image_id)
				inner join product_image_text using(product_image_id)
			where
				product_image.product_image_id = :pk
				and product_image_text.lang_id = :lang
		`, {
			pk: this.pk,
			lang: this.getEditingLang().lang_id
		});

		if (!row)
			throw new Error(`Cannot find product image by ID: ${this.pk}`);

		const tags = await this.getDb().sql(`
			select
				image_tag.*
			from
				image_tag_rel
				inner join image_tag using(image_tag_id)
			where
				image_tag_rel.product_image_id = :pk
			order by
				image_tag.title
		`, {
			pk: this.pk
		});

		//@ts-ignore
		const {product_id, image_id} = row;

		const variants = await this.getDb().sql(`
			select
				variant_id
			from
				variant
				inner join variant_image using (variant_id)
			where
				product_id = :product_id
				and image_id = :image_id
				and variant.deleted_at is null
		`, {
			product_id,
			image_id
		});


		Object.assign(row, {
			tags: tags || [],
			//@ts-ignore
			variants: (variants || []).map(el => el.variant_id)
		});

		return row;
	}

	async getTplData() {
		const out = await super.getTplData();

		//@ts-ignore
		const imgProportion = await this.getSetting('system', 'imgProportion');
		//@ts-ignore
		out.imgRow = this.getModel('productImage').prepareImgRow(
			this.getInstanceRegistry(),
			imgProportion,
			this.record
		);

		return out;
	}

	async setup() {
		if (!this.pk)
			throw new Error('Form is only for editing');

		return await super.setup();
	}

	async saveTags() {
		await this.getDb().sql(`
			delete from
				image_tag_rel
			where
				image_tag_rel.product_image_id = :pk
		`, {
			pk: this.pk
		});

		//@ts-ignore
		const {tag_ids, tag_titles} = this.getSafeAttrs();
		const tags = tag_ids || [];

		if (tag_titles) {
			for (const tag of tag_titles) {
				const [row] = await this.getDb().sql(`
					insert into
						image_tag
						(title)
					values
						(:title)
					on conflict do nothing
					returning
						image_tag_id
				`, {
					title: tag.trim()
				});

				if (row) {
					//@ts-ignore
					const {image_tag_id} = row;
					if (image_tag_id) tags.push(image_tag_id);
				}
			}
		}

		for (const tag of tags) {
			await this.getDb().sql(`
				insert into
					image_tag_rel
					(product_image_id, image_tag_id)
				values
					(:pk, :tagId)
			`, {
				pk: this.pk,
				tagId: Number(tag)
			});
		}
	}

	async saveVariants() {
		const attrs = this.getSafeAttrs();
		const variants = attrs.variants || [];

		for (const variant of variants) {
			await this.getDb().sql(`
				insert into variant_image
					(variant_id, image_id, is_default)
				values
					(:variantId, :imageId, false)
				on conflict do nothing
			`, {
				variantId: variant,
				//@ts-ignore
				imageId: this.record.image_id
			});
		}

		const where = variants.length > 0 ? 'and variant_id not in (:variantIds)' : '';
		const deletedVariants = await this.getDb().sql(`
			delete from
				variant_image
			where
				image_id = :imageId
				${where}
			returning
				variant_id
		`, {
			variantIds: variants,
			//@ts-ignore
			imageId: this.record.image_id
		});

		//@ts-ignore
		const redefineVariants = deletedVariants.map(el => el.variant_id).concat(variants);

		await this.getModel('variant').updateVariantsDefaultImg(redefineVariants);
	}

	async getVariantsOptions() {
		const rows = await this.getDb().sql(`
			select
				variant_id,
				title
			from
				variant
			inner join variant_text using (variant_id)
			where
				product_id = :productId
				and lang_id = :langId
				and variant.deleted_at is null
		`, {
			//@ts-ignore
			productId: this.record.product_id,
			langId: this.getEditingLang().lang_id
		});

		//@ts-ignore
		return rows.map(el => [el.variant_id, el.title]);
	}

	async rawOptions() {
		return {
			variants: await this.getVariantsOptions()
		};
	}
}