import DataProvider from '../../../../modules/dataProvider/index';

export default class CommodityGroupDataProvider extends DataProvider {
	getRules() {
		return [
			['title,type', 'safe']
		//@ts-ignore
		].concat(super.getRules());
	}

	createQuery() {
		this.q.from('commodity_group', 'g');
		this.q.join('commodity_group_text', 'gt', 'gt.group_id = g.group_id');
		this.q.where('gt.lang_id = ?', this.getEditingLang().lang_id);

		this.compareRmStatus('g.deleted_at');
		this.compare('g.type', this.getSafeAttr('type'));
		this.compare('gt.title', this.getSafeAttr('title'), true);
	}

	sortRules() {
		return {
			default: [{title: 'asc'}],
			attrs: {
				group_id: 'g.product_id',
				title: 'gt.title',
				type: 'g.type'
			}
		};
	}

	rawOptions() {
		const options = super.rawOptions();
		//@ts-ignore
		options.type = this.getModel('commodityGroup').getTypeOptions(this.getI18n(), [['', this.__('All')]]);
		//@ts-ignore
		options.vat = this.getModel('setting').getVatOptions(this.getI18n());

		return options;
	}
}