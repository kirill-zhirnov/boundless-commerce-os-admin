import Form from '../../../../modules/form/index';
import AdminProductToBasket from '../../../orders/actions/admin/toBasket';

export default class ProductBasket extends Form {
	constructor(options) {
		super(options);

		this.variants = [];
		this.orderId = options.orderId;
		this.trackInventory = null;
	}

	// initialize(options) {
	// 	this.variants = [];
	// 	this.orderId = options.orderId;
	// 	this.trackInventory = null;

	// 	return super.initialize(...arguments);
	// }

	setup() {
		return this.getRegistry().getSettings().get('inventory', 'trackInventory')
			.then(function (value) {
				this.trackInventory = value;

				//@ts-ignore
				return ProductBasket.prototype.__proto__.setup.call(this, ...arguments);
			}.bind(this));
	}

	getRules() {
		return [
			['variant', 'required'],
			['variant', 'inOptions', {options: 'variant'}]
		];
	}

	//@ts-ignore
	async loadRecord() {
		const [row] = await this.getDb().sql('\
select \
p.product_id, \
p.sku, \
pt.title as product_title, \
pg.not_track_inventory as product_not_track_inventory, \
null as variant_not_track_inventory, \
null as variant_id \
from \
product p \
inner join product_text pt on p.product_id = pt.product_id and pt.lang_id = :lang \
left join commodity_group pg on pg.group_id = p.group_id \
where \
p.product_id = :product\
', {
			product: this.pk,
			lang: this.getEditingLang().lang_id
		});

		if (!row) {
			throw new Error('Product not found!');
		}
		//@ts-ignore
		row.trackInventory = this.getModel('inventoryItem').shallTrackInventoryByRow(this.trackInventory, row);

		return row;
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const orderId = this.orderId && (this.orderId !== '') ? this.orderId : null;

		const toBasket = new AdminProductToBasket(this.getController(), null, orderId);
		//@ts-ignore
		await toBasket.addVariant(attrs.variant);
	}

	async getTplData() {
		const superData = await super.getTplData();
		const data = {
			variants: this.variants,
			orderId: this.orderId,
			//@ts-ignore
			trackInventory: this.attributes.trackInventory,
			record: this.record
		};

		return {
			...superData,
			...data
		};
	}

	async loadVariantOptions() {
		const rows = await this.getModel('variant')
			//@ts-ignore
			.loadVariants(this.pk, this.getEditingSite().point_id, this.getEditingLang().lang_id, this.trackInventory);

		const out = [];
		this.variants = [];
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (!row.inStock) {
				continue;
			}

			row.formatted_price = this.getLocale().formatMoney(row.price);

			let qty = '';
			if (row.trackInventory) {
				qty = this.getI18n().__(', qty: %s', [row.available_qty]);
			}

			this.variants.push(row);
			out.push([
				row.variant_id,
				`${row.title} - ${row.formatted_price}${qty}`
			]);
		}

		return out;
	}

	rawOptions() {
		return {
			variant: this.loadVariantOptions()
		};
	}
}