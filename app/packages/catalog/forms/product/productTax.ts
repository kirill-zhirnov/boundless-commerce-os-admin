import {TTaxStatus} from '../../../../@types/product';
import Form from '../../../../modules/form';
import {IProductModel} from '../../models/product';
import {ITaxClassModelStatic} from '../../../system/models/taxClass';

interface IAttrs {
	tax_status: TTaxStatus;
	tax_class_id: number|null|string;
}

export default class ProductTaxForm extends Form<IAttrs, IProductModel> {
	getRules() {
		return [
			['tax_status', 'required'],
			['tax_status', 'inOptions', {options: 'status'}],
			['tax_class_id', 'inOptions', {options: 'taxClass'}]
		];
	}

	setupAttrsByRecord() {
		const {tax_status, tax_class_id} = this.record.productProp!;
		this.setAttributes({
			tax_status,
			tax_class_id: (tax_class_id === null) ? '' : tax_class_id
		});
	}

	async save() {
		// eslint-disable-next-line prefer-const
		let {tax_status, tax_class_id} = this.getSafeAttrs();
		const productProp = this.record.productProp!;

		tax_class_id = (tax_class_id !== '') ? parseInt(String(tax_class_id)) : null;
		await productProp.set({
			tax_status,
			tax_class_id
		}).save();
	}

	rawOptions() {
		return {
			status: [
				['taxable', this.__('Taxable')],
				['none', this.__('None')],
			],
			taxClass: (this.getModel('taxClass') as ITaxClassModelStatic).findTaxClassOptions([['', this.__('Use tax class by default')]])
		};
	}
}