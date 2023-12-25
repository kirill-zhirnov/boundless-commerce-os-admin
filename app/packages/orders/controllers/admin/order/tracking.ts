import BasicAdmin from '../../../../system/controllers/admin';
import * as orderEvents from '../../../components/orderEventNotification';
import {ITrackNumberModelStatic} from '../../../models/trackNumber';

export default class TrackNumberController extends BasicAdmin {
	async actionList() {
		const orderId = parseInt(this.getParam('order'));
		if (isNaN(orderId)) {
			this.rejectHttpError(400, 'Incorrect input param');
			return;
		}

		const trackingNumbers = await this.loadTrackNums(orderId);

		this.json({trackingNumbers});
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-orders/forms/order/trackingNumber', {
			orderId: this.getParam('order')
		}, {
			beforeJson: async (result, closeModal, formKit, form) => {
				const trackNumber = await form.getRecord();
				Object.assign(result.json, {
					trackNumber
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Add track number') : this.__('Edit track number');
			this.modal('form', {data}, title);
		}
	}

	async actionRm() {
		const record = await (this.getModel('trackNumber') as ITrackNumberModelStatic).findOne({
			where: {
				track_number_id: this.getParam('id')
			}
		});
		const orderId = record.order_id;
		await record.destroy();

		await orderEvents.notifyOrderChanged(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			orderId,
			{trackingNumbers: await this.loadTrackNums(orderId)}
		);

		this.json({});
	}

	protected loadTrackNums(orderId: number) {
		return this.getModel('trackNumber').findAll({
			where: {
				order_id: orderId
			},
			order: [['created_at', 'asc']]
		});
	}
}