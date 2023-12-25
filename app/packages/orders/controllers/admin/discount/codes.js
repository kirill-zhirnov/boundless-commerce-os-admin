import GridResource from '../../../../../modules/controller/resources/grid';

export default class Codes extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'orders.couponCodesGrid.@c',
			provider: '@p-orders/dataProvider/admin/discount/codes',
			model: 'couponCampaign',
			form: {
				path: '@p-orders/forms/discount/codes'
			}
		};
	}

	actionIndex() {
		this.setPage({
			title: this.p__('discount', 'Codes')
		});

		return super.actionIndex();
	}

	async actionMakeCodes() {
		const amount = parseInt(this.getParam('amount'));

		if (isNaN(amount) || amount > 1000 || amount < 1) {
			this.alertDanger(this.getI18n().__('Value should be less than %s', [1000]));
			this.json({result: false});
			return;
		}

		const codes = await this.getModel('couponCode').makeUniqueCodes(amount);
		this.json({
			result: true,
			codes: codes
		});
	}
}