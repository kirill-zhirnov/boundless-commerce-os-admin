import Form from '../../../modules/form/index';
import _ from 'underscore';

export default class CommodityGroup extends Form {
	constructor(options) {
		super(options);

		this.trackInventory = null;
	}

	getRules() {
		return [
			['title', 'required'],
			[
				'title',
				'isUnique',
				{
					//@ts-ignore
					model: this.getModel('commodityGroupText'),
					//@ts-ignore
					row: this.record ? this.record.commodityGroupTexts[0] : null,
					criteria: {
						where: {
							lang_id: this.getEditingLang().lang_id
						}
					}
				}
			],
			// ['vat', 'inOptions', {options: 'vat'}],
			// yml_export
			['track_inventory, is_default, physical_products', 'safe'],
			//			['type, unit_id', 'required']
			//			['type', 'inOptions', {options:'type'}],
			//			['unit_id', 'inOptions', {options:'unit'}]
		];
	}

	loadRecord() {
		//@ts-ignore
		return this.getModel('commodityGroup').findException({
			include: [{
				model: this.getModel('commodityGroupText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				group_id: this.pk
			}
		});
	}

	async setup() {
		//@ts-ignore
		const [option] = await this.getOptions('unit');

		if (option) {
			this.defaultUnitMeasurement = option[0];
		}
		await super.setup();

		this.trackInventory = await this.getInstanceRegistry().getSettings().get('inventory', 'trackInventory');

		if (!this.record) {
			this.attributes.yml_export = '1';
		}
	}

	getDefaultAttrs() {
		return {
			type: 'material',
			unit_id: this.defaultUnitMeasurement,
			yml_export: '1',
			vat: 'noVat',
			physical_products: '1',
			track_inventory: '1'
		};
	}

	setupAttrsByRecord() {
		const row = this.record.toJSON();

		const attrs = _.extend({}, _.pick(row, ['group_id', 'type', 'unit_id', 'vat']));

		const checkboxes = ['not_track_inventory', 'is_default', 'physical_products'];
		for (const val of checkboxes) {
			if (row[val]) {
				attrs[val] = '1';
			}
		}

		//@ts-ignore
		attrs.track_inventory = !this.record.not_track_inventory ? '1' : null;
		_.extend(attrs, _.pick(row.commodityGroupTexts[0], ['title']));

		this.setAttributes(attrs);
	}

	async save() {
		//@ts-ignore
		const {is_default, track_inventory, title, physical_products} = this.getSafeAttrs();

		if (is_default === '1') {
			await this.getModel('commodityGroup').update({
				is_default: false
			}, {
				where: {}
			});
		}

		const upAttrs = {
			type: 'material',
			unit_id: this.defaultUnitMeasurement,
			not_track_inventory: Boolean(this.trackInventory && (track_inventory !== '1')),
			is_default: is_default === '1',
			physical_products: physical_products === '1'
		};

		const row = await this.getRecord();
		if (row) {
			await this.getModel('commodityGroup').update(upAttrs, {
				where: {
					group_id: row.group_id
				}
			});
		} else {
			const newGroup = await this.getModel('commodityGroup').create(upAttrs);
			this.pk = newGroup.group_id;
		}

		const text = await this.findTextModel('commodityGroupText', {
			//@ts-ignore
			group_id: this.pk,
			lang_id: this.getEditingLang().lang_id
		});
		text.set({title});
		await text.save();

		await this.setGroupItemsStocks();

		//@ts-ignore
		await this.getModel('commodityGroup').checkDefaultExists();
	}

	rawOptions() {
		return {
			//@ts-ignore
			type: this.getModel('commodityGroup').getTypeOptions(this.getI18n()),
			//@ts-ignore
			unit: this.getModel('unitMeasurement').findOptions(),
			isDefault: [
				['0', this.__('No')],
				['1', this.__('Yes')],
			],
			//@ts-ignore
			vat: this.getModel('setting').getVatOptions(this.getI18n())
		};
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.trackInventory = this.trackInventory;

		return data;
	}

	onFormsGroupSaved() {
		// return this.essenceChanged('commodityGroup', this.pk, 'change');
	}

	async setGroupItemsStocks() {
		const {track_inventory} = this.getSafeAttrs();

		//@ts-ignore
		await this.getModel('inventoryItem').reCalcAvailableQty(track_inventory == '1', {groupId: this.pk});
	}
}