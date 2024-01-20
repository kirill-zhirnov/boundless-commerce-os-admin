import GridResource from '../../../../modules/controller/resources/grid';
import {notifyEvent} from '../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';
import {Op} from 'sequelize';
import {IPriceModelStatic} from '../../models/price';

export default class PricesController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'catalog.pricesGrid.@c',
			provider: '@p-catalog/dataProvider/admin/prices',
			model: 'price',
		});
	}

	actionIndex() {
		this.setPage({
			title: this.__('Price Types')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-catalog/forms/priceForm', {}, {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = (data.scenario == 'insert') ? this.__('Create a Price type') : this.__('Edit price types');
			this.modal('form', {data}, title);
		}
	}

	async actionBulkRm() {
		const price_id = this.getParam('id');
		if (!Array.isArray(price_id)) {
			this.rejectHttpError(400, 'Bad request');
			return;
		}

		await this.getModel('price').safeDelete({
			where: {
				price_id,
				alias: {
					[Op.notIn]: (this.getModel('price') as IPriceModelStatic).getSystemAliases()
				}
			}
		});

		await notifyEvent(
			'price',
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.archived,
			price_id
		);

		this.alertSuccess(this.__('Selected items were successfully archived.'));
		this.json({});
	}
}