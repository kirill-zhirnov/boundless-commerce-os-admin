import GridResource from '../../../../modules/controller/resources/grid';

export default class UsersController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'auth.usersGrid.@c',
			provider: '@p-auth/dataProvider/admin/users',
			model: 'person',
			form: '@p-auth/forms/users'
		};
	}

	async actionIndex() {
		const dataProvider = await this.createDataProvider('@p-auth/dataProvider/admin/users');
		await dataProvider.validate();

		this.setPage('title', this.__('Admin users'));

		const data = await dataProvider.getTplData();
		//@ts-ignore
		data.isOwner = this.getUser().isOwner();
		this.widget('auth.usersGrid.@c', {data});
	}

	async actionBulkRm() {
		const ids = this.getParam('id');
		const idsHaveUser = Array.isArray(ids) && ids.map(el => parseInt(el)).includes(this.getUser().getId());

		if (!this.getUser().isOwner() || idsHaveUser) {
			this.rejectHttpError(403, this.__('Access denied'));
			return;
		}
		await super.actionBulkRm();
	}

	async actionBulkRestore() {
		if (!this.getUser().isOwner()) {
			this.rejectHttpError(403, this.__('Access denied'));
			return;
		}

		const limitNotReached = await this.getInstanceRegistry().getTariff().checkUsersLimit();
		if (limitNotReached) {
			await super.actionBulkRestore();
		} else {
			this.alertDanger(this.__('Tariff\'s users limit is reached.'));
		}
	}

	async actionForm() {
		if (!this.getUser().isOwner()) {
			this.rejectHttpError(403, this.__('Access denied'));
			return;
		}

		const formKit = this.createFormKit('@p-auth/forms/users', {});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			const title = (data.scenario === 'update')
				? this.__('Edit admin user')
				: this.__('Create admin user');

			//@ts-ignore
			data.buttons = Object.assign({}, {
				predefinedButtons: {
					save:
					{
						title: data.scenario === 'update'
							? this.__('Save')
							: this.__('Invite'),
					}
				},
				buttons: ['save']
			});

			this.modal('form', data, title);
		}
	}
}