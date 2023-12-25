import BasicAdminController from '../../../system/controllers/admin';
import {IPersonAddressModelStatic} from '../../models/personAddress';
import * as eventNotification from '../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';

export default class AddressController extends BasicAdminController {
	async actionList() {
		const personId = parseInt(this.getParam('person'));
		if (isNaN(personId)) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		const rows = await (this.getModel('personAddress') as IPersonAddressModelStatic).findAll({
			where: {
				person_id: personId
			},
			order: [
				['is_default', 'desc']
			]
		});

		this.json(rows);
	}

	async actionForm() {
		const personId = parseInt(this.getParam('person'));
		if (isNaN(personId)) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		const formKit = this.createFormKit('@p-customer/forms/admin/address', {personId}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				Object.assign(result.json, {
					address: await form.getRecord()
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			data.personId = personId;

			const title = (data.scenario == 'insert') ? this.__('Add address') : this.__('Edit address');
			this.modal('form', {data}, title);
		}
	}

	async postActionSetDefault() {
		const personId = parseInt(this.getParam('person'));
		const addressId = parseInt(this.getParam('address'));

		if (isNaN(personId) || isNaN(addressId)) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		const PersonAddressModel = this.getModel('personAddress') as IPersonAddressModelStatic;
		await PersonAddressModel.update({
			is_default: false
		}, {
			where: {
				person_id: personId
			}
		});
		await PersonAddressModel.update({
			is_default: true
		}, {
			where: {
				person_id: personId,
				address_id: addressId
			}
		});
		await PersonAddressModel.checkIsDefaultExists(personId);

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			personId
		);

		this.json(true);
	}

	async postActionRm() {
		const personId = parseInt(this.getParam('person'));
		const addressId = parseInt(this.getParam('address'));

		if (isNaN(personId) || isNaN(addressId)) {
			this.rejectHttpError(400, 'Incorrect product');
			return;
		}

		const PersonAddressModel = this.getModel('personAddress') as IPersonAddressModelStatic;
		await PersonAddressModel.destroy({
			where: {
				address_id: addressId,
				person_id: personId
			}
		});
		await PersonAddressModel.checkIsDefaultExists(personId);

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.updated,
			personId
		);

		this.json(true);
	}
}