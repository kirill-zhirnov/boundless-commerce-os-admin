import BasicAdmin from '../../../../system/controllers/admin';

export default class CharacteristicController extends BasicAdmin {
	async actionQuickForm() {
		const groupId = parseInt(this.getParam('groupId'));
		const productId = parseInt(this.getParam('productId'));

		const formKit = this.createFormKit('@p-catalog/forms/characteristic/quickEdit', {
			groupId,
			productId
		}, {
			successMsg: false,
			beforeJson: (result, closeModal, formKit) => {
				//@ts-ignore
				result.json.characteristics = formKit.form.getProductCharacteristics();
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.modal(
				'quickForm',
				{data: data},
				//@ts-ignore
				data.scenario === 'update'
					? this.__('Edit Attribute "%s"', [data.attrs.title])
					: this.__('Create the new Attribute')
			);
		}
	}
}