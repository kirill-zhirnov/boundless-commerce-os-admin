import GridResource from '../../../../modules/controller/resources/grid';
import _ from 'underscore';

export default class WarehouseMovementsController extends GridResource {
	init() {
		super.init();

		//@ts-ignore
		this.grid = {
			widget: 'inventory.warehouseMovementsGrid.@c',
			provider: '@p-inventory/dataProvider/admin/warehouseMovements',
			form: '@p-inventory/forms/warehouseMovement',
			model: 'inventory_movement'
		};
	}

	actionIndex() {
		this.setPage({
			title: this.__('Warehouse movements')
		});

		return super.actionIndex();
	}

	async actionForm() {
		const formKit = this.createFormKit('@p-inventory/forms/warehouseMovement', {}, {
			successRedirect: ['inventory/admin/warehouseMovements/index', this.getParam('grid')]
		});

		this.getAnswer().setLayoutData('currentMenuUrl', this.url('inventory/admin/warehouseMovements/index'));

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			data.grid = this.getParam('grid');

			const title = (data.pk != null) ? this.__('Edit movement') : this.__('Create movement');
			this.setPage({title: this.__(`${title}`)});

			//@ts-ignore
			_.extend(data.buttons, {
				buttons: ['saveDraft', 'save'],
				predefinedButtons: {
					saveDraft: {
						icon: 'glyphicon glyphicon-floppy-disk',
						value: 'draft'
					},

					save: {
						title: this.__('Perform transfer'),
						icon: 'glyphicon glyphicon-arrow-right',
						value: 'completed'
					}
				}
			});

			this.widget('inventory.warehouseMovementForm.@c', {data});
		}
	}

	async actionFormCancel() {
		if (this.isSubmitted()) {
			const formKit = this.createFormKit('@p-inventory/forms/warehouseMovementCancel', {}, {
				successRedirect: ['inventory/admin/warehouseMovements/index', this.getParam('grid')]
			});

			await formKit.process();
		} else {
			this.modal('transferCancelForm', {
				data: {
					pk: this.getParam('pk')
				}
			}, this.__('Confirm transfer cancel'));
		}
	}

	async actionAutocomplete() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/itemsMovementAutocomplete');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionProductVariants() {
		const dataProvider = await this.createDataProvider('@p-inventory/dataProvider/admin/productVariants');
		const rows = await dataProvider.getData();
		this.modal('variantsForm', {variants: rows}, this.__('Choose variant'), '@p-inventory/modals/chooseProductVariant.@c');
	}
}