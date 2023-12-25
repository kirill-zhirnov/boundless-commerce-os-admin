import GridResource from '../../../../modules/controller/resources/grid';
import {IPersonModel} from '../../models/person';
import {TQueueEventType} from '../../../../@types/rabbitMq';
import * as eventNotification from '../../../../modules/notifier/eventNotification';

export default class CustomerController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'customer.customerGrid.@c',
			provider: '@p-customer/dataProvider/admin/customer',
			model: 'person',
			exporterWidget: '@p-customer/widgets/export/customerGrid'
		});
	}

	actionIndex() {
		this.setPage({
			title: this.__('Customers')
		});

		return super.actionIndex();
	}

	async actionForm() {
		if (!this.getParam('pk')) {
			await this.createDraftCustomer();
			return;
		}

		const group = this.createFormsGroup({
			customer: {
				form: '@p-customer/forms/admin/customer',
				children: {
					customAttrs: '@p-customer/forms/admin/customerForm/customAttrs'
				}
			},
		}, {
			skipSetupOnEmpty: ['customAttrs'],
			successRedirect: false,
			beforeJson: async (result, closeModal, formsGroup) => {
				const {customer} = await formsGroup.getForms();
				const person = (await customer.getRecord() as IPersonModel).toJSON();
				Object.assign(result.json, {
					person
				});
			}
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();

			Object.assign(data, {
				grid: this.getParam('grid', {})
			});

			//@ts-ignore
			const title = data.forms.customer.scenario === 'insert' ? this.__('Create new customer') : this.__('Edit customer');

			this.setPage('title', title);
			this.getAnswer().setLayoutData('currentMenuUrl', this.url('customer/admin/customer/index'));
			this.render('form', {
				data
			});
		}
	}

	async actionAutocomplete() {
		const dataProvider = await this.createDataProvider('@p-customer/dataProvider/admin/customerAutocomplete');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async createDraftCustomer() {
		const [{person_id}] = await this.getDb().sql(`
			insert into person
				(site_id, status, created_by)
			values
				(:site, 'draft', :created)
			on conflict
				(status, created_by)
			where
				status = 'draft'
				and created_by is not null
			do update set
				status = excluded.status
			returning person_id
	`, {
			site: this.getEditingSite().site_id,
			created: this.getUser().getId()
		});

		const params = {
			pk: person_id
		};

		const grid = this.getParam('grid');
		if (grid) {
			Object.assign(params, {
				grid
			});
		}

		this.redirect(['customer/admin/customer/form', params]);
	}

	async actionBulkRm() {
		await super.actionBulkRm();

		const ids = this.getParam('id');

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.archived,
			ids
		);
	}

	async actionBulkRestore() {
		await super.actionBulkRestore();

		const ids = this.getParam('id');

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			TQueueEventType.restored,
			ids
		);
	}
}