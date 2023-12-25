import Form from '../../../../../modules/form';
import {IOrdersModel} from '../../../models/orders';
import {IOrderAttrsModel, IOrderAttrsModelStatic} from '../../../models/orderAttrs';
// import {TOrderAttrHtmlType} from '../../../../../@types/orders';

interface IAttrs {
	values: {
		[key: string]: any;
	}
}

export default class OrderCustomAttrs extends Form<IAttrs> {
	protected order?: IOrdersModel;
	protected customAttrs: IOrderAttrsModel[] = [];
	protected customAttrsByKeys: {[key: string]: IOrderAttrsModel} = {};

	getRules() {
		return [
			['values', 'validateValues']
		];
	}

	async setup() {
		await super.setup();

		this.customAttrs = await (this.getModel('orderAttrs') as IOrderAttrsModelStatic).findAll({
			order: [
				['sort', 'asc']
			]
		});

		this.customAttrsByKeys = {};
		for (const attrRow of this.customAttrs) {
			this.customAttrsByKeys[attrRow.key] = attrRow;
		}
	}

	async save() {
		const orderProp = this.order.orderProp!;
		const attrs = this.getSafeAttrs();

		if (orderProp.custom_attrs === null) {
			orderProp.custom_attrs = {};
		}

		orderProp.custom_attrs = Object.assign({}, orderProp.custom_attrs, attrs.values);
		await orderProp.save();
	}

	validateValues(value) {
		const sanitizedValues = {};
		for (const attrRow of this.customAttrs) {
			sanitizedValues[attrRow.key] = null;

			if (value && attrRow.key in value) {
				sanitizedValues[attrRow.key] = value[attrRow.key];
			}
		}

		this.attributes.values = sanitizedValues;
	}

	setOrderRecord(record: IOrdersModel) {
		this.order = record;
	}
}