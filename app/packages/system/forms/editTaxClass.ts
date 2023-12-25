import Form from '../../../modules/form/index';
import {ITaxClassModel, ITaxClassModelStatic} from '../models/taxClass';
import {ICountryModelStatic} from '../../delivery/models/country';
import {ITaxRate} from '../../../@types/system';
import validator from 'validator';

interface IAttrs {
	title: string;
	is_default: string;
	taxRates: ITaxRate[];
}

export default class EditTaxClassForm extends Form<IAttrs, ITaxClassModel> {
	getRules() {
		return [
			['title', 'required'],
			['title', 'trim'],
			['is_default, taxRates', 'safe']
		];
	}

	async save() {
		const {title, is_default, taxRates} = this.getSafeAttrs();
		const isDefault = ['1', 'true'].includes(String(is_default).toLowerCase());

		if (isDefault) {
			await (this.getModel('taxClass') as ITaxClassModelStatic).resetDefaults();
		}

		await (this.getModel('taxClass') as ITaxClassModelStatic).update({
			title,
			is_default: isDefault
		}, {
			where: {
				tax_class_id: this.pk
			}
		});
		await (this.getModel('taxClass') as ITaxClassModelStatic).checkDefaultExists();

		if (Array.isArray(taxRates)) {
			for (const taxRateRow of taxRates) {
				let {tax_rate_id, title, rate, priority, is_compound, include_shipping, country_id, state_code} = taxRateRow;

				tax_rate_id = parseInt(String(tax_rate_id)) || 0;
				title = String(validator.trim(title)).substr(0, 50);
				rate = String(Number(String(rate).replace(',', '.')) || 0);
				priority = parseInt(String(priority)) || 0;
				country_id = parseInt(String(country_id)) || null;
				state_code = String(validator.trim(state_code)).substr(0, 10);
				is_compound = ['1', 'true'].includes(String(is_compound).toLowerCase());
				include_shipping = ['1', 'true'].includes(String(include_shipping).toLowerCase());

				await this.getModel('taxRate').update({
					title, rate, priority, is_compound, include_shipping, country_id,
					state_code: state_code ? state_code : null
				}, {
					where: {
						tax_rate_id
					}
				});
			}
		}
	}

	async loadRecord(): Promise<ITaxClassModel> {
		const TaskRateModel = this.getModel('taxRate');

		return await (this.getModel('taxClass') as ITaxClassModelStatic).findException({
			include: [{
				model: TaskRateModel
			}],
			where: {
				tax_class_id: this.pk
			},
			order: [[TaskRateModel, 'priority', 'ASC']]
		}) as ITaxClassModel;
	}

	setupAttrsByRecord() {
		const {title, is_default} = this.record;
		const taxRates = (this.record.taxRates ? this.record.taxRates : []).map((row) => row.toJSON());

		this.setAttributes({
			title,
			is_default,
			taxRates
		});
	}

	rawOptions() {
		return {
			country: (this.getModel('country') as ICountryModelStatic).findCountryOptions(this.getEditingLang().lang_id),
		};
	}
}