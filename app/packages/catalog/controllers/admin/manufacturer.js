import GridResource from '../../../../modules/controller/resources/grid';
import * as editingManufacturerChooser from '../../modules/editingManufacturerChooser';

export default class ManufacturerController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'catalog.manufacturerGrid.@c',
			provider: '@p-catalog/dataProvider/admin/manufacturer',
			model: 'manufacturer',
			form: '@p-catalog/forms/manufacturer',
			essence: 'manufacturer'
		});
	}

	actionIndex() {
		this.setPage({
			title: this.getI18n().__('Manufacturers')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const pk = this.getParam('pk');

		if (!pk && !this.isSubmitted()) {
			await this.createNewManufacturer();
			return;
		}

		const group = this.createFormsGroup({
			manufacturer: {
				form: this.grid.form,
				children: {
					//					props : '@p-catalog/forms/manufacturer/props'
					logo: '@p-catalog/forms/manufacturer/logo',
					seo: '@p-catalog/forms/manufacturer/seo'
				}
			}
		}, {
			skipSetupOnEmpty: ['logo'],
			forceCloseModal: true
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();

			//@ts-ignore
			const title = data.forms?.manufacturer?.scenario === 'insert' ? this.__('Create') : this.__('Edit');

			this.modal('form', data, title, null, {
				setSize: 'large'
			});
		}
	}

	async postActionQuickEdit() {
		const formKit = this.createFormKit('@p-catalog/forms/manufacturer/quickEdit', {}, {
			successMsg: false,
			beforeJson: (result) => {
				//@ts-ignore
				const options = formKit.form.manufacturerOptions;

				if (this.getParam('createOption') === '1') {
					options.push(['create', this.__('+ Create new manufacturer')]);
				}

				//@ts-ignore
				result.json.options = options;
			}

		});
		await formKit.process();
	}

	async actionCreateUrl() {
		if (!this.getParam('title') || !this.getParam('pk')) {
			this.alertDanger('you need to provide title and pk');
			this.json({});
			return;
		}

		//@ts-ignore
		const urlKey = await this.getModel('manufacturer').createUrlKeyByTitle(this.getParam('title'), this.getLang().code, this.getParam('pk'));
		this.json({url: urlKey});
	}

	async createNewManufacturer() {
		const result = await editingManufacturerChooser.get(this, this.getUser().getId());
		const params = {
			pk: result.id
		};

		this.modalRedirect(['catalog/admin/manufacturer/form', params]);
	}
}