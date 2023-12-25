import BasicAdmin from '../../../system/controllers/admin';

export default class ImageTagController extends BasicAdmin {
	async actionAutocomplete() {
		const request = (this.getParam('q') || '').trim().toLowerCase();
		const tags = await this.getDb().sql(`
			select
				*
			from
				image_tag
			where
				lower(title) like :request
		`, {
			request: `%${request}%`
		});

		this.json(tags || []);
	}
}