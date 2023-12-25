import BasicDataProvider, {TPreparedData} from '../../../modules/dataProvider';
import {IFeedsModel} from '../models/feeds';
import {IFormOptions} from '../../../modules/form';
import {sqlAggArr2Objects} from '../../../modules/utils/sql';

export default class FeedDataProvider extends BasicDataProvider {
	protected feed: IFeedsModel;

	constructor(options: IFormOptions & {feed: IFeedsModel}) {
		super(options);

		this.feed = options.feed;
	}

	createQuery() {
		const langId = this.getLang().lang_id;
		const escapedLang = this.getDb().escape(langId);

		this.q.field('vw.*');
		this.q.field('product_imgs.images');
		this.q.field('product_text.description as product_description');
		this.q.field('product_labels.labels as product_labels');
		this.q.field('manufacturer_text.title as manufacturer_title');

		this.q.from('vw_inventory_item', 'vw');
		this.q.join('product', null, 'product.product_id = vw.product_id');
		this.q.join('product_text', null, 'product_text.product_id = vw.product_id and product_text.lang_id = vw.lang_id');
		this.q.join('final_price', null, 'final_price.item_id = vw.item_id');
		this.q.join('price', null, 'final_price.price_id = price.price_id');
		this.q.left_join('manufacturer_text', null, 'manufacturer_text.manufacturer_id = product.manufacturer_id and manufacturer_text.lang_id = vw.lang_id');
		this.q.left_join(`
			(
				SELECT
					product_image.product_id,
					product_image_text.lang_id,
					json_build_object('image_id', json_agg(image.image_id ORDER BY product_image.sort), 'path', json_agg(image.path), 'width', json_agg(image.width), 'height', json_agg(image.height), 'is_default', json_agg(product_image.is_default), 'description', json_agg(product_image_text.description), 'alt', json_agg(product_image_text.alt)) AS images
				FROM
					product_image
					JOIN product_image_text USING (product_image_id)
					JOIN image USING (image_id)
				GROUP BY
					product_image.product_id,
					product_image_text.lang_id
			)`,
			'product_imgs',
			'product_imgs.product_id = product.product_id and product_imgs.lang_id = vw.lang_id'
		);
		this.q.left_join(`
			(
				select
					product_id,
					json_build_object('label_id', json_agg(label.label_id), 'title', json_agg(label_text.title)) AS labels
				from
					product_label_rel
					inner join label using(label_id)
					inner join label_text using(label_id)
				where
					label_text.lang_id = ${escapedLang}
				group by
					product_label_rel.product_id
			)
		`, 'product_labels', 'product_labels.product_id = product.product_id');

		this.q.where('vw.status = ? and vw.deleted_at is null', 'published');
		this.q.where('vw.lang_id = ?', langId);
		this.q.where('(price.alias = ? and final_price.value is not null)', 'selling_price');

		const {manufacturer, collection, commodity_group, categories} = this.feed.conditions;
		if (manufacturer) {
			this.q.where('product.manufacturer_id = ?', manufacturer);
		}

		if (collection) {
			this.q.join(
				'collection_product_rel',
				'cpr',
				'product.product_id = cpr.product_id'
			);
			this.q.where('cpr.collection_id = ?', collection);
		}

		if (commodity_group) {
			this.q.where('product.group_id = ?', commodity_group);
		}

		if (Array.isArray(categories)) {
			const uniqCategories = [...new Set(categories)];

			if (uniqCategories.length > 0) {
				this.q.where(`
					exists (
						select
							1
						from
							product_category_rel
							inner join category using(category_id)
						where
							category.deleted_at is null
							and category.status = 'published'
							and category_id IN (${this.getDb().escapeIn(uniqCategories)})
							and product_category_rel.product_id = vw.product_id
					)
				`);
			}
		}
	}

	prepareData(rows): TPreparedData {
		rows = rows.map(({prices, image, images, product_labels, ...rest}) => {
			prices = sqlAggArr2Objects(prices);

			if (prices) {
				prices = prices.filter(({alias}) => alias === 'selling_price');
			}

			return {
				...rest,
				images: sqlAggArr2Objects(images),
				product_labels: sqlAggArr2Objects(product_labels),
				selling_price: (prices && prices[0]) ? prices[0] : null
			};
		});

		return [this.getMetaResult(), rows];
	}
}