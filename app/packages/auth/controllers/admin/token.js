import BasicAdminController from '../../../system/controllers/admin';

export default class TokenController extends BasicAdminController {
	async actionIndex() {
		const dataProvider = await this.createDataProvider('@p-auth/dataProvider/admin/token');
		await dataProvider.validate();

		this.setPage('title', this.__('Access tokens'));

		const data = await dataProvider.getTplData();
		this.widget('auth.tokenGrid.@c', {data});
	}

	async actionCollection() {
		const dataProvider = await this.createDataProvider('@p-auth/dataProvider/admin/token');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-auth/forms/token', {}, {
			beforeJson: async ({json: {pk}}, closeModal, formKit) => {
				const form = await formKit.getForm();

				if (form.getScenario() == 'insert') {
					this.metaModal(['auth/admin/token/form', {pk}]);
				}
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			const title = (data.scenario === 'update')
				? this.__('Update API key')
				: this.__('Create API key')
			;
			this.modal('form', {data}, title, null, {
				setSize: 'large'
			});
		}
	}

	async actionBulkRm() {
		const ids = this.getParam('id');
		if (!Array.isArray(ids) || !ids.length) return;

		await this.getDb().sql(`
			update
				api_token
			set
				deleted_at = now()
			where
				token_id in (:ids)
		`, {
			ids
		});

		this.json({});
	}

	async actionBulkRestore() {
		const ids = this.getParam('id');
		if (!Array.isArray(ids) || !ids.length) return;

		await this.getDb().sql(`
			update
				api_token
			set
				deleted_at = null
			where
				token_id in (:ids)
		`, {
			ids
		});

		this.json({});
	}


	async actionRevoke() {
		const ids = this.getParam('id');
		if (!Array.isArray(ids) || !ids.length) return;

		await this.getDb().sql(`
			update
				api_token
			set
				permanent_token = null,
				require_exp = true
			where
				token_id in (:ids)
		`, {
			ids
		});

		this.json({});
	}
}