import GridResource from '../../../../modules/controller/resources/grid';
import _ from 'underscore';

export default class FilterController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'catalog.filterGrid.@c',
			provider: '@p-catalog/dataProvider/admin/filter',
			model: 'filter',
			form: '@p-catalog/forms/filter/filter',
			afterRmClb: () => {
				//@ts-ignore
				return this.getModel('filter').checkDefaultExists();
			}
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Catalog filter sets')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit(this.grid.form, {}, {
			forceCloseModal: true,
			// successRedirect: ,
			beforeJson: async (result, closeModal, formKit) => {
				const form = await formKit.getForm();

				//@ts-ignore
				if (form.getIsNewRecord()) {
					this.metaRedirect(['catalog/admin/filter/form', {pk: form.getPk()}]);
				} else {
					this.metaRedirect(['catalog/admin/filter/index', this.getParam('grid')]);
				}
			}
		});

		this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/filter/index'));

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			const title = data.pk != null
				? this.__('Edit filter set')
				: this.__('Create filter set');

			this.setPage({title});

			//@ts-ignore
			data.grid = this.getParam('grid');
			//@ts-ignore
			data.buttons = data.buttons || {};
			//@ts-ignore
			data.buttons.buttons = ['save'];

			this.render('form', data);
		}
	}

	async actionAddField() {
		const formKit = this.createFormKit('@p-catalog/forms/filter/addField', {
			filter: this.getParam('filter')
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			_.extend(data.buttons, {
				predefinedButtons: {
					save: {
						title: this.__('Add')
					}
				}
			});

			this.modal('addField', {formData: data}, this.__('Add field in filter'));
		}
	}

	async actionRmField() {
		const model = this.getModel('filterField');
		const options = {
			where: {
				'field_id': this.getParam('id')
			}
		};

		await model.safeDelete(options);

		this.json({});
	}

	async actionLoadCharacteristic() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/characteristicFilter', {}, {
			filterId: this.getParam('filterId'),
			groupId: this.getParam('groupId')
		});

		const data = await dataProvider.getData();

		this.json(data);
	}

	async actionFieldsCollection() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/filterField', {}, {
			filterId: this.getParam('filterId')
		});
		const data = await dataProvider.getData();

		this.json(data);
	}

	async actionSaveFieldSort() {
		const sort = this.getParam('sort');
		const filterId = parseInt(this.getParam('filterId'));

		if (!filterId || !Array.isArray(sort)) {
			this.rejectHttpError(400, 'Wrong params');
			return;
		}

		const row = await this.getModel('filterField').findOne({
			where: {
				filter_id: filterId,
				type: 'category'
			}
		});

		if (row) {
			//@ts-ignore
			sort.unshift(row.field_id);
		}
		//@ts-ignore
		await this.getModel('filterField').updateSort(filterId, sort);

		this.json({});
	}
}