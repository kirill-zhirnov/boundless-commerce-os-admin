import {create} from 'xmlbuilder2';
import {XMLBuilder} from 'xmlbuilder2/lib/interfaces';
import {TDataFeed, TExportableItem} from './types';
import BasicFeed from './basicFeed';
import {getImgCloudServer} from '../../../../modules/s3Storage/serverCloudUrl';
import {TInventoryType} from '../../../../@types/inventoryItem';
import {IDataProviderMetaResult} from '../../../../@types/dataProvider';

const googleNamespace = 'http://base.google.com/ns/1.0';

export default class GoogleFeed extends BasicFeed {
	public contentType = 'text/xml';

	// https://support.google.com/merchants/answer/7052112?hl=en&ref_topic=6324338
	public async export(dataFeed: TDataFeed) {
		const storeTitle = this.feed.data.shop_title;
		const storeLink = this.feed.data.shop_url;
		const storeDescription = this.feed.data.shop_description;

		const xml = create({namespaceAlias: {g: googleNamespace}})
			.ele(null, 'rss', {'version': '2.0'})
      .att('xmlns:g', googleNamespace)
			.ele('channel')
				.ele('title').txt(storeTitle).up()
				.ele('link').txt(storeLink).up()
				.ele('description').txt(storeDescription).up();

		const totalPages = Math.ceil(dataFeed[0].totalEntries / dataFeed[0].perPage);
		if (totalPages > 1) {
			this.appendPagination(xml, dataFeed[0], totalPages);
		}

		await this.appendItems(xml, dataFeed[1]);

		xml.up().up();
		return xml.end({prettyPrint: true});
	}

	appendPagination(xml: XMLBuilder, metaResult: IDataProviderMetaResult, totalPages: number) {
		let currentFound = false;
		for (let i = 1; i <= totalPages; i++) {
			if (metaResult.page == i) {
				currentFound = true;
				continue;
			} else if (currentFound) {
				xml.ele('link').att('rel', 'next').att('href', this.makePaginationLink(i)).up();
				break;
			}
		}
	}

	makePaginationLink(page: number) {
		return this.instanceRegistry.getRouter()
			.url('catalog/feed/google', {id: this.feed.feed_id, page}, true);
	}

	async appendItems(xml: XMLBuilder, items: TExportableItem[]) {
		for (const item of items) {
			await this.appendItem(xml, item);
		}
	}


	async appendItem(xml: XMLBuilder, row: TExportableItem) {
		const xmlItem = xml.ele('item')
			.ele(googleNamespace, 'g:id').txt(String(row.item_id)).up()
			.ele(googleNamespace, 'g:title').txt(this.makeItemTitle(row)).up()
			.ele(googleNamespace, 'g:description').txt(row.product_description).up()
			.ele(googleNamespace, 'g:link').txt(this.makeProductUrl(row)).up()
		;

		this.appendImages(xmlItem, row);

		xmlItem.ele(googleNamespace, 'g:availability')
			.txt(row.available_qty > 0 ? 'in_stock' : 'out_of_stock').up();

		this.appendPrices(xmlItem, row);

		if (row.manufacturer_title) {
			xmlItem.ele(googleNamespace, 'brand').txt(row.manufacturer_title).up();
		}

		if (row.type === TInventoryType.variant) {
			xmlItem.ele(googleNamespace, 'g:item_group_id').txt(String(row.product_id)).up();
		}

		if (Array.isArray(row.product_labels)) {
			row.product_labels
				.filter((label, i) => i < 5)
				.forEach(({title}, i) => xmlItem.ele(googleNamespace, `g:custom_label_${i}`).txt(title).up())
			;
		}

		xmlItem.up();
	}

	appendPrices(xmlItem: XMLBuilder, row: TExportableItem) {
		if (row.selling_price) {
			const price = row.selling_price;
			const currency = price.currency_alias.toUpperCase();

			const priceValue = (price.old !== null) ? price.old : price.value;
			xmlItem.ele(googleNamespace, 'g:price')
				.txt(`${priceValue} ${currency}`).up();

			if (price.old !== null) {
				xmlItem.ele(googleNamespace, 'g:sale_price')
					.txt(`${price.value} ${currency}`).up();
			}
		}
	}

	appendImages(xml: XMLBuilder, row: TExportableItem) {
		if (!Array.isArray(row.images)) {
			return;
		}

		const defaultImage = row.images.find(({is_default}) => is_default);
		if (!defaultImage) {
			return;
		}

		xml.ele(googleNamespace, 'g:image_link')
			.txt(getImgCloudServer(this.instanceRegistry, defaultImage.path, 1800)).up();

		row.images
			.filter(({is_default}) => !is_default)
			.forEach(({path}) =>
				xml.ele(googleNamespace, 'g:additional_image_link')
					.txt(getImgCloudServer(this.instanceRegistry, path, 1800)).up()
			);
	}
}