import BasicAdmin from '../admin';

export default class CleanUpController extends BasicAdmin {
	async actionIndex() {
		const formKit = this.createFormKit('@p-system/forms/dbCleanUp', {}, {
			successMsg: this.__('Database was successfully cleaned up.'),
			beforeJson: () => {
				//				@metaReload {nativeReload : true}
				return this.metaRedirect(this.url('dashboard/admin/index'));
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			Object.assign(data, {
				buttons: {
					predefinedButtons: {
						save: {
							title: this.__('Clean database'),
							class: 'btn btn-danger'
						}
					}
				}
			});

			this.modal('dbCleanUp', data, this.__('Clean database'));
		}
	}
}