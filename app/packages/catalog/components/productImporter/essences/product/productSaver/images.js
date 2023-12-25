import BasicSaver from '../basic';
import validator from '../../../../../../../modules/validator/validator';

export default class ImagesSaver extends BasicSaver {
	/**
	 * @returns {Promise}
	 */
	async process() {
		if (!Array.isArray(this.dataRow.images))
			return;

		for (const img of this.dataRow.images) {
			if (!('src' in img))
				return;

			if (!validator.isURL(img.src, {require_protocol: true}))
				return;

			const res = await this.shallSaveImg(img);
			if (res) {
				this.logger.setImagesAdded(true);

				await this.db.model('productImportImgs').create({
					import_id: this.import.import_id,
					url: img.src,
					product_id: this.product.product_id
				});
			}
		}
	}

	async shallSaveImg(img) {
		const rows = await this.db.sql(`
			select
				1
			from
				product_image
			where
				product_id = :product
				and source_url = :url
		`, {
			product: this.product.product_id,
			url: this.db.model('productImage').prepareSourceUrl(img.src)
		});

		if (rows.length) return false;

		return true;
	}
}