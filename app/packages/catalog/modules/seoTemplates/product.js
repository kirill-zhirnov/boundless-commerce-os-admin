import BasicSeoTpls from './basic';
import _ from 'underscore';
import errors from '../../../../modules/errors/errors';

export default class ProductTemplates extends BasicSeoTpls {
	async getTemplates() {
		if (!this.templates) {
			const seoTpls = await this.getSetting('system', 'seoTemplates');
			this.templates = seoTpls.product;
		}

		return this.templates;
	}

	async compileByProductId(id) {
		let productInfo = await this.getModel('product').loadProduct(
				this.getInstanceRegistry(),
				id,
				this.getSite().point_id,
				this.getLang().lang_id
			),
			variants = []
		;

		if (!productInfo)
			throw new errors.HttpError(404, 'Product not found');

		if (productInfo.has_variants) {
			variants = await this.getModel('variant').loadVariants(
				id,
				this.getSite().point_id,
				this.getLang().lang_id,
				await this.getSetting('inventory', 'trackInventory')
			);
		}

		return await this.compileByProductRow(productInfo, variants);
	}

	async compileByProductRow(productInfo, variants = []) {
		return {
			title: await this.compileTitle(productInfo, variants),
			metaDesc: await this.compileMetaDesc(productInfo, variants)
		};
	}

	async compileTitle(productInfo, variants = [], runInVm = false) {
		const templates = await this.getTemplates();

		return this.compile(
			templates.title,
			this.prepareData(productInfo, variants),
			runInVm
		);
	}

	async compileMetaDesc(productInfo, variants = [], runInVm = false) {
		const templates = await this.getTemplates();

		return this.compile(
			templates.metaDescription,
			this.prepareData(productInfo, variants),
			runInVm
		);
	}

	fakeData() {
		return {
			product: {
				product_id: 1,
				title: 'Laptop MacBook Pro 15',
				sku: 'MCB-Pro-15',
				description: 'Laptop MacBook Pro 15 - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer a posuere arcu, vitae dignissim tortor.',
				default_category_title: 'Laptops',
				inStock: true,
				has_variants: true,
				manufacturer_title: 'Apple',
				price: '1999.00',
				price_old: '2399.00',
				labels: [
					{title: 'New!'}
				]
			},
			variants: [
				{
					title: 'MacBook pro 15, 512Gb, gray',
					sku: 'MCB-Pro-15-512-gray',
					price: '2199.00',
					priceOld: '2499.00',
					inStock: true
				},
				{
					title: 'MacBook pro 15, 1024Gb, gold',
					sku: 'MCB-Pro-15-512-gold',
					price: '2299.00',
					priceOld: '2599.00',
					inStock: true
				}
			]
		};
	}

	prepareData(productInfo, variants) {
		let out = {
			id: productInfo.product_id,
			title: productInfo.title || '',
			sku: productInfo.sku || '',
			skuVariants: _.pluck(variants, 'sku').join(', '),
			description: '',
			shortDescription: '',
			category: productInfo.default_category_title || '',
			inStock: productInfo.inStock,
			hasVariants: productInfo.has_variants,
			manufacturer: productInfo.manufacturer_title || '',
			price: '',
			priceOld: '',
			labels: _.pluck(productInfo.labels, 'title').join(', '),
			variants: []
		};

		if (productInfo.description) {
			out.description = this.prepareHtmlText(productInfo.description);
			out.shortDescription = this.cutShortHtmlText(out.description);
		}

		if (productInfo.price) {
			out.price = Array.isArray(productInfo.price) ? productInfo.price[0] : productInfo.price;
			out.price = this.getLocale().formatMoney(out.price);
		}

		if (productInfo.price_old) {
			out.priceOld = Array.isArray(productInfo.price_old) ? productInfo.price_old[0] : productInfo.price_old;
			out.priceOld = this.getLocale().formatMoney(out.priceOld);
		}

		variants.forEach((row) => {
			let variantRow = {
				title: row.title,
				sku: row.sku,
				price: '',
				priceOld: '',
				inStock: true
			};

			if (row.price)
				variantRow.price = this.getLocale().formatMoney(row.price);

			if (row.price_old)
				variantRow.priceOld = this.getLocale().formatMoney(row.price_old);

			out.variants.push(variantRow);
		});

		return Object.assign(out, this.getTplFunctions());
	}
}