import ExtendedModel from '../../../modules/db/model';
import Form from '../../../modules/form';

interface IAttrs {
	title: string,
	stock_location: string,
	alias: string | null,
	background_color: string | null,
	sort: number | string,
}

export default class OrderStatusForm extends Form<IAttrs> {
	getRules() {
		return [
			['title', 'trim'],
			['title, stock_location', 'required'],
			['stock_location', 'inOptions', {options: 'stock'}],
			['background_color, alias, sort', 'safe']
		];
	}

	async save() {
		const {title, background_color, sort} = this.getSafeAttrs();
		const {lang_id} = this.getLang();

		const bgColor = background_color?.length > 6 ? background_color.substring(1) : background_color;
		const parsedSort = sort || sort === 0 ? Number(sort) : null;

		const status_id = this.pk || await this.createNewStatus(parsedSort, bgColor);

		if (this.pk) await this.updateExistingStatus(parsedSort, bgColor);

		await this.getDb().sql(`
			update
				order_status_text
			set
				title = :title
			where
				status_id = :status_id
				and lang_id = :lang_id
		`, {
			status_id,
			title,
			lang_id,
		});
	}

	async loadRecord() {
		const [row] = await this.getDb().sql(`
			select
				order_status.*,
				order_status_text.*
			from
				order_status
			left join order_status_text using (status_id)
			where
				status_id = :id
		`, {
			id: this.pk
		});

		return row as ExtendedModel;
	}

	rawOptions() {
		return {
			stock: [
				['inside', this.__('Reserved. Items are located in a warehouse and reserved for an order.')],
				['outside', this.__('Shipped. Items are shipped.')],
				['basket', this.__('Not reserved.')],
			]
		};
	}

	async createNewStatus(sort: number | null, background_color: string) {
		const {stock_location} = this.getSafeAttrs();

		const [row] = await this.getDb().sql(`
			insert into
				order_status
			(background_color, stock_location, sort)
			values
				(upper(:background_color),
				:stock_location,
				:sort)
			returning
				status_id
		`, {
			stock_location,
			background_color,
			sort
		});

		return (row as {status_id: string | number}).status_id;
	}

	async updateExistingStatus(sort: number | null, background_color: string) {
		const {stock_location} = this.getSafeAttrs();

		await this.getDb().sql(`
			update
				order_status
			set
				background_color = upper(:background_color),
				stock_location = :stock_location,
				sort = :sort
			where
				status_id = :id
		`, {
			id: this.pk,
			stock_location,
			background_color,
			sort
		});
	}
}