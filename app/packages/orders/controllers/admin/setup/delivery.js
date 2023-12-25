import BasicAdminController from '../../../../system/controllers/admin';
import _ from 'underscore';

export default class DeliveryController extends BasicAdminController {
	async actionSettings() {
		const dataProvider = await this.createDataProvider('@p-orders/dataProvider/admin/delivery');
		await dataProvider.validate();
		const data = await dataProvider.getTplData();

		this.setPage('title', this.__('Shipping methods'));
		this.widget('orders.deliveryGrid.@c', {data});
	}

	async actionSettingsCollection() {
		const dataProvider = await this.createDataProvider('@p-orders/dataProvider/admin/delivery');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionCreateForm() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/create', {}, {
			forceCloseModal: true,
			success(safeAttrs, pk) {
				let url;
				switch (safeAttrs.type) {
					case 'custom':
						url = this.controller.url('orders/admin/setup/delivery/formCustom');
						break;
					// case 'boxBerry':
					// 	url = this.controller.url('orders/admin/setup/delivery/formBoxBerry');
					// 	break;
					case 'selfPickup':
						url = this.controller.url('orders/admin/setup/delivery/formSelfPickup');
						break;
					// case 'rusSnailMail':
					// 	url = this.controller.url('orders/admin/setup/delivery/formRusSnailMail');
					// 	break;
					// case 'cdek':
					// 	url = this.controller.url('orders/admin/setup/delivery/cdek');
					// 	break;
					default:
						throw new Error(`Unknown type: '${safeAttrs.type}'`);
				}

				this.controller.modalRedirect(url);
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			Object.assign(data, {
				buttons: {
					buttons: ['save'],
					predefinedButtons: {
						save: {
							title: this.__('Next'),
							icon: null
						}
					}
			}});

			this.modal('createForm', {formData: data}, this.__('Choose a shipping company:'));
		}
	}

	async actionFormCustom() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/custom', {}, {
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			let title;
			if (data.scenario === 'insert') {
				title = this.__('Create new delivery method');
			} else {
				title = this.__('Edit "%s"', [data.attrs.title]);
			}

			this.modal('formCustom', {formData: data}, title);
		}
	}

/*
	actionFormRusSnailMail() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/rusSnailMail', {}, {
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			return formKit.getWebForm()
				.then(data => {
					return this.modal('formRusSnailMail', {formData: data}, this.__('Russian post shipping'));
				}).done();
		}
	}*/
/*
	actionFormBoxBerry() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/boxBerry', {}, {
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			return formKit.getWebForm()
				.then(data => {
					return this.modal('formBoxBerry', {formData: data}, this.__('BoxBerry shipping'), null, {
						setSize: 'large'
					});
				})
				.done();
		}
	}*/

	async actionFormSelfPickup() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/selfPickup', {}, {
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.modal('formSelfPickup', {formData: data}, this.__('Self pickup'));
		}
	}

	/*
	actionCdek() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/cdek', {}, {
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			return formKit.process();
		} else {
			return formKit.getWebForm()
				.then(data => {
					return this.modal('cdek', {formData: data}, this.__('CDEK shipping'), null, {
						setSize: 'large'
					});
				})
				.done();
		}
	}*/

	/*
	actionCdekCityAutocomplete() {
		return this.createDataProvider('@p-orders/dataProvider/admin/cdekCityAutocomplete')
			.then(dataProvider => {
				return dataProvider.getData();
			}).then(result => {
				return this.json(result);
			}).done();
	}*/

	async actionBulkRm() {
		await this.getModel('delivery').safeDelete({
			where: {
				delivery_id: this.getParam('id')
			}
		});

		await this.getModel('city').refreshCityDeliveryView();
		this.json({});
	}

	async actionBulkRestore() {
		await this.getModel('delivery').recover({
			where: {
				delivery_id: this.getParam('id')
			}
		});
		await this.getModel('city').refreshCityDeliveryView();
		this.json({});
	}

	// actionCommonSettings() {
	// 	this.getAnswer().setLayoutData('currentMenuUrl', this.url('orders/admin/setup/delivery/settings'));
	//
	// 	const formKit = this.createFormKit('@p-orders/forms/delivery/commonSettings');
	//
	// 	if (this.isSubmitted()) {
	// 		return formKit.process();
	// 	} else {
	// 		return formKit.getWebForm()
	// 			.then(data => {
	// 				this.setPage({
	// 					title: this.__('Common settings')
	// 				});
	//
	// 				_.extend(data.buttons, {
	// 					buttons: ['save'],
	// 					predefinedButtons: {
	// 						save: {
	// 							title: this.__('Save')
	// 						}
	// 					}
	// 				});
	//
	// 				return this.render('commonSettings/form', data);
	// 			});
	// 	}
	// }

	postActionImgUpload() {
		const formKit = this.createFormKit('@p-orders/forms/delivery/imageUploader', {}, {
			successMsg: false,
			beforeJson(result, closeModal, formKit) {
				return result.json.uploadedData = formKit.form.getUploadedFileSrc();
			}
		});

		return formKit.process();
	}
}