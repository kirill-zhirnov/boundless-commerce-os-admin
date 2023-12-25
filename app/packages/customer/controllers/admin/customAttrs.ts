import BasicAdminController from '../../../system/controllers/admin';
import {IPersonAttrsModelStatic} from '../../models/personAttrs';
import {IPersonProfileModel, IPersonProfileModelStatic} from '../../models/personProfile';

export default class CustomerCustomAttrsController extends BasicAdminController {
	async actionList() {
		const attributes = await (this.getModel('personAttrs') as IPersonAttrsModelStatic).findAll({
			order: [['sort', 'asc']]
		});

		const person = await (this.getModel('personProfile') as IPersonProfileModelStatic).findException({
			where: {
				person_id: this.getParam('person')
			}
		}) as IPersonProfileModel;

		this.json({
			attributes,
			values: person.custom_attrs || {}
		});
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-customer/forms/admin/customAttr', {}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				const personAttr = await form.getRecord();
				Object.assign(result.json, {
					personAttr
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Add custom attribute') : this.__('Edit custom attribute');
			this.modal('form', {data}, title);
		}
	}

	async actionRm() {
		const attr_id = this.getParam('id');
		const record = await (this.getModel('personAttrs') as IPersonAttrsModelStatic).findOne({
			where: {
				attr_id
			}
		});

		if (record) {
			await this.getDb().sql(`
				update
					person_profile
				set
					custom_attrs = custom_attrs  - :key
			`, {
				key: record.key
			});
			await record.destroy();
		}

		this.json(true);
	}
}