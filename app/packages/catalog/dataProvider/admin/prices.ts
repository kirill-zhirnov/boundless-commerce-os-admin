import DataProvider, {IDataProviderDefaults} from '../../../../modules/dataProvider/index';
import {IOptionsList, TFormRules} from '../../../../modules/form';
import {ICustomerGroup} from '../../../../@types/person';
import {IPrice} from '../../../../@types/catalog';
import {ICustomerGroupModelStatic} from '../../../customer/models/customerGroup';

interface IAttrs extends IDataProviderDefaults {
	title?: string;
	alias?: string;
	is_public?: string;
}

interface IRow extends IPrice {
	title: string;
}

export default class PricesDataProvider extends DataProvider<IRow, IAttrs> {
	getRules() {
		return ([
			['title, alias, is_public', 'safe'],
			['group_id', 'isNum'],
			['group_id', 'inOptions', {options: 'groups'}],
			['is_public', 'inOptions', {options: 'isPublic'}],
		] as TFormRules).concat(super.getRules());
	}

	createQuery() {
		this.q.field('price.*');
		this.q.field('price_text.title');
		this.q.field('price_groups.groups');

		this.q.from('price');
		this.q.join('price_text', null, 'price_text.price_id = price.price_id');
		this.q.where('price_text.lang_id = ?', this.getEditingLang().lang_id);
		this.q.left_join(`
			(
				select
					price_id,
					json_agg(customer_group.title order by customer_group.title) as groups
				from
					customer_group
					inner join price_group_rel using (group_id)
				group by
					price_id
			)
		`, 'price_groups', 'price_groups.price_id = price.price_id');


		this.compareRmStatus('price.deleted_at');

		const {title, alias, is_public, group_id} = this.getSafeAttrs();

		this.compare('price_text.title', title, true);
		this.compare('price.alias', alias, true);

		if (['1', '0'].includes(is_public)) {
			this.q.where('price.is_public is ' + (is_public == '1' ? 'true' : 'false'));
		}

		if (group_id) {
			this.q.where(`
				exists (
					select 1 from price_group_rel
					where
						price_group_rel.price_id = price.price_id
						and price_group_rel.group_id = ?
				)
			`, [group_id]);
		}
	}

	sortRules() {
		return {
			default: [{sort: 'asc'}],
			attrs: {
				sort: {
					asc: 'price.sort asc',
					desc: 'price.sort desc'
				},
				title: {
					asc: 'price_text.title asc',
					desc: 'price_text.title desc'
				}
			}
		};
	}

	rawOptions(): IOptionsList | Promise<IOptionsList> {
		return Object.assign(super.rawOptions(), {
			isPublic: [
				['', this.__('All')],
				['0', this.__('Private')],
				['1', this.__('Public')]
			],
			groups: (this.getModel('customerGroup') as ICustomerGroupModelStatic).findCustomerOptions([['', this.__('All groups')]])
		});
	}
}