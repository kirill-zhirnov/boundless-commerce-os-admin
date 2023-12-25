import Form from '../../../../modules/form/index';
import * as thumbnailUrl from '../../../cms/modules/thumbnail/url';

export default class ManufacturerLogo extends Form {
	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.logo = await this.loadLogo();

		return data;
	}

	async loadLogo() {
		const [row] = await this.getDb().sql(`
			select
				image.*
			from
				manufacturer
			inner join image using (image_id)
			where
				manufacturer_id = :manufacturerId
		`, {
			manufacturerId: this.pk
		});

		let out = null;

		if (row != null) {
			out = row;
			//@ts-ignore
			out.smallThumb = thumbnailUrl.getAttrs(this.getInstanceRegistry(), row, 'scaled', 'xs');
		}

		return out;
	}
}