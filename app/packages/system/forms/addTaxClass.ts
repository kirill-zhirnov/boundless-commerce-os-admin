import Form from '../../../modules/form/index';
import {ITaxClassModelStatic} from '../models/taxClass';
import {ITaxRateModelStatic} from '../models/taxRate';

interface IAttrs {
	title: string;
	is_default: string;
}

export default class AddTaxClassForm extends Form<IAttrs> {
	getRules() {
		return [
			['title', 'required'],
			['title', 'trim'],
			['is_default', 'safe']
		];
	}

	async save() {
		const {title, is_default} = this.getSafeAttrs();
		const isDefaultClass = is_default == '1';

		if (isDefaultClass) {
			await (this.getModel('taxClass') as ITaxClassModelStatic).resetDefaults();
		}

		const taxClass = await (this.getModel('taxClass') as ITaxClassModelStatic).create({
			title,
			is_default: isDefaultClass
		});
		await (this.getModel('taxClass') as ITaxClassModelStatic).checkDefaultExists();

		await (this.getModel('taxRate') as ITaxRateModelStatic)
			.createTaxRate(taxClass.tax_class_id, this.__('Tax'))
		;
	}
}