import DataProvider, {IDataProviderDefaults} from '../../../../modules/dataProvider/index';
import {TFormRules} from '../../../../modules/form';
import {ICustomerGroup} from '../../../../@types/person';

interface IAttrs extends IDataProviderDefaults {
	title?: string;
	alias?: string;
}

export default class CustomerGroupDataProvider extends DataProvider<ICustomerGroup, IAttrs> {
	getRules() {
		return ([
			['title, alias', 'safe'],
		] as TFormRules).concat(super.getRules());
	}

	createQuery() {
		this.q.from('customer_group');
		this.compareRmStatus('customer_group.deleted_at');

		const {title, alias} = this.getSafeAttrs();
		this.compare('customer_group.title', title, true);
		this.compare('customer_group.alias', alias, true);
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				title: {
					asc: 'customer_group.title asc',
					desc: 'customer_group.title desc'
				}
			}
		};
	}
}