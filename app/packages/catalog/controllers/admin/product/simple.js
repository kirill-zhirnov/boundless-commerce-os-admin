const pathAlias = require('path-alias');
const BasicAdmin = pathAlias('@basicAdmin');

class SimpleController extends BasicAdmin {
	async actionForm() {
		let pk = this.getParam('pk');
		if (!pk) {
			const isAllowCreate = await this.getInstanceRegistry().getTariff().checkProductLimit();
			if (!isAllowCreate) {
				this.alertDanger(this.__("Tariff's product limit is reached."));
				this.json({});
				return;
			}
		}

		let group = this.createFormsGroup({
			product: {
				form: '@p-catalog/forms/product/simple/product',
				options: {
					collection: this.getParam('collection')
				},
				children: {
					categories: '@p-catalog/forms/product/simple/categories',
					labels: '@p-catalog/forms/product/labels',
					stockAndPrice: '@p-catalog/forms/product/stockAndPrice/forProduct'
				}
			},
		}, {
			skipSaveOnEmpty: ['stockAndPrice'],
			successMsg: false,
			beforeJson: () => {
				this.triggerClient('changed.products', {id: this.getParam('collection')})
			}
		});

		if (this.isSubmitted()) {
			group.process();
			return
		}

		let data = await group.getWebForms(),
			title = this.__('Edit product "%s"', [data.forms.product.attrs.title])
		;

		if (data.forms.product.scenario == 'insert') {
			title = this.__('Create product');
		}

		this.modal('form', {data}, title, null, {
			appendDialogClass: ['admin-modal']
		});
	}
}

module.exports = SimpleController;