import {TQueueEventType} from '../../../../@types/rabbitMq';
import Form from '../../../../modules/form/index';
import {IInventoryItemModelStatic} from '../../../inventory/models/inventoryItem';
import * as productEvents from '../../components/productEventNotification';
import {ICommodityGroupModelStatic} from '../../models/commodityGroup';

interface IAttr {
	group_id: number;
}

export default class GroupForm extends Form<IAttr> {
	getRules() {
		return [
			['group_id', 'required'],
			['group_id', 'inOptions', {options: 'group'}],
		];
	}

	async save() {
		const {group_id} = this.getSafeAttrs();

		await this.getRecord();
		const record = this.record as {[key: string]: any};

		const groupChanged = Number(group_id) !== Number(record.commodityGroup.group_id);
		if (!groupChanged) return;

		record.group_id = group_id;
		await record.save();

		await this.changeItemsStockOnGroupChange();

		await productEvents.notifyProductsEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			this.pk
		);
	}

	loadRecord() {
		const pk = parseInt(String(this.pk)) || null;

		//@ts-ignore
		return this.getModel('product').findException({
			include: [
				{
					model: this.getModel('commodityGroup'),
				},
			],
			where: {
				product_id: pk
			}
		});
	}

	rawOptions() {
		return {
			group: this.loadCommodityGroupOptions()
		};
	}

	async loadCommodityGroupOptions() {
		const options = await (this.getModel('commodityGroup') as ICommodityGroupModelStatic).fetchOptions(this.getEditingLang().lang_id);
		options.push(['create', this.__('+ Create new Product Type')]);

		return options;
	}

	async changeItemsStockOnGroupChange() {
		const {group_id} = this.getSafeAttrs();
		const prevTrackInventory = !(this.record as {[key: string]: any}).commodityGroup.not_track_inventory;
		const newGroup = await (this.getModel('commodityGroup') as ICommodityGroupModelStatic).findOne({
			where: {
				group_id
			}
		});
		const newTrackInventory = !newGroup.not_track_inventory;
		if (prevTrackInventory === newTrackInventory) return;  //no need to change stocks

		const productId = (this.record as {[key: string]: any}).product_id;

		await (this.getModel('inventoryItem') as IInventoryItemModelStatic).reCalcAvailableQty(newTrackInventory, {productId});
	}
}