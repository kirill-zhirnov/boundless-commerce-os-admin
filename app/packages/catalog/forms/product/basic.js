import Form from '../../../../modules/form/index';

export default class ProductBasicForm extends Form {
	constructor(options) {
		super(options);

		this.trackInventory = null;
	}

	async setup() {
		await super.setup();

		this.trackInventory = await this.getInstanceRegistry().getSettings().get('inventory', 'trackInventory');
	}

	loadRecord() {
		const pk = parseInt(this.pk) || 0;

		//@ts-ignore
		return this.getModel('product').findException({
			include: [
				{
					model: this.getModel('productText'),
					where: {
						lang_id: this.getEditingLang().lang_id
					}
				},
				{
					model: this.getModel('commodityGroup'),
					include: [
						{
							model: this.getModel('unitMeasurement')
						}
					]
				},
				{
					model: this.getModel('productProp')
				},
				{
					model: this.getModel('inventoryItem')
				},
			],
			where: {
				product_id: pk
			}
		});
	}

	getCommodityGroupSettings(commodityGroup = null) {
		if (!commodityGroup)
		//@ts-ignore
		commodityGroup = this.record.commodityGroup;

		const out = {
			trackInventory: {
				value: true,
				offBy: null
			},
			unit: this.__('pcs.'),
			groupId: null,
			ymlExport: false
		};

		if (commodityGroup) {
			Object.assign(out, {
				groupId: commodityGroup.group_id,
				ymlExport: commodityGroup.yml_export,
			});

			if (commodityGroup.unitMeasurement)
				out.unit = this.__(commodityGroup.unitMeasurement.title);

			if (this.trackInventory) {
				if (commodityGroup.not_track_inventory) {
					out.trackInventory = {
						value: false,
						offBy: 'group'
					};
				} else {
					out.trackInventory.value = true;
				}
			} else {
				out.trackInventory = {
					value: false,
					offBy: 'setting'
				};
			}
		}

		return out;
	}
}