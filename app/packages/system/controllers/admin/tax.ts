import BasicAdmin from '../admin';
import {ITaxClassModelStatic} from '../../models/taxClass';
import {ITaxRate} from '../../../../@types/system';
import {ITaxRateModelStatic} from '../../models/taxRate';

export default class TaxController extends BasicAdmin {
	async actionIndex() {
		const formKit = this.createFormKit('@p-system/forms/taxOptions', {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.setPage('title', this.__('Tax options'));
			this.render('index', {data});
		}
	}

	async actionClasses() {
		this.getAnswer().setLayoutData('currentMenuUrl', this.url('system/admin/tax/index'));

		this.setPage('title', this.__('Tax Classes'));
		this.render('classes');
	}

	async actionAddClass() {
		const formKit = this.createFormKit('@p-system/forms/addTaxClass');

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.modal('addClass', {data}, this.__('Create tax class'));
		}
	}

	async actionTaxClassCollection() {
		const dataProvider = await this.createDataProvider('@p-system/dataProvider/admin/taxClass');
		this.json(
			await dataProvider.getData()
		);
	}

	async actionEditTaxClass() {
		this.getAnswer().setLayoutData('currentMenuUrl', this.url('system/admin/tax/index'));

		const formKit = this.createFormKit('@p-system/forms/editTaxClass', {}, {
			successRedirect: ['system/admin/tax/classes'],
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			this.setPage('title', this.__('Edit Tax Class "%s"', [data.attrs.title]));
			this.render('editTaxClass', {data});
		}
	}

	async actionAddTaxRate() {
		const taxClassId = parseInt(this.getParam('taxClassId')) || 0;
		const taxRate = await (this.getModel('taxRate') as ITaxRateModelStatic)
			.createTaxRate(taxClassId, this.__('The new Tax Rate'))
		;

		this.json({taxRate});
	}

	async actionRmTaxRate() {
		const tax_rate_id = parseInt(this.getParam('taxRateId')) || 0;

		await this.getModel('taxRate').destroy({
			where: {tax_rate_id}
		});

		this.json(true);
	}

	//removes tax classes
	async actionBulkRm() {
		const tax_class_id = this.getParam('id', []);

		await this.getModel('taxClass').destroy({
			where: {tax_class_id}
		});
		await (this.getModel('taxClass') as ITaxClassModelStatic).checkDefaultExists();

		this.json(true);
	}
}