import GridResource from '../../../../modules/controller/resources/grid';
import _ from 'underscore';

export default class CharacteristicController extends GridResource {
	init() {
		super.init();

		Object.assign(this.grid, {
			widget: 'catalog.characteristicGrid.@c',
			provider: '@p-catalog/dataProvider/admin/characteristic',
			model: 'characteristic'
		});
	}

	actionIndex() {
		this.setPage('title', this.getI18n().__('Characteristics'));

		return super.actionIndex();
	}

	async actionCollection() {
		const dataProvider = await this.createDataProvider(this.grid.provider);
		const data = await dataProvider.getData();

		this.json(data);
	}

	async actionForm() {
		const groupId = this.getParam('groupId');
		const group = this.createFormsGroup({
			characteristic: {
				form: '@p-catalog/forms/characteristic/characteristic',
				options: {
					groupId
				},
				/*
				children: {
					system: {
						form: '@p-catalog/forms/characteristic/system',
						options: {
							groupId
						}
					},
					// help: '@p-catalog/forms/characteristic/help'
				}*/
			}
		}, {forceCloseModal: false});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			const data = await group.getWebForms();
			//@ts-ignore
			data.params = {groupId};

			//@ts-ignore
			this.modal(
				'form',
				data,
				data.forms?.characteristic?.scenario === 'update'
					? this.__('Edit Attribute "%s"', [data.forms.characteristic.attrs.title])
					: this.__('Create the new Attribute')
			);
		}
	}

	async actionFolderForm() {
		const groupId = this.getParam('groupId');
		const formKit = this.createFormKit('@p-catalog/forms/characteristic/folder', {
			groupId
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			//@ts-ignore
			data.params = {groupId};

			//@ts-ignore
			this.modal('folderForm', data, data.scenario === 'insert' ? this.__('Create new group') : this.__('Edit group "%s"', [data.attrs.title]));
		}
	}

	async actionBulkRm() {
		let id = this.getParam('id');
		if (_.isArray(id)) {
			for (let i = 0; i < id.length; i++) {
				const val = id[i];
				id[i] = parseInt(val);
			}
		} else {
			id = parseInt(id);
		}

		await this.getDb().sql(`\
delete from \
characteristic \
where \
characteristic_id in (${this.getDb().escapeIn(this.getParam('id'))}) \
and characteristic_id not in ( \
select \
characteristic_id \
from \
characteristic_variant_val \
where \
rel_type = 'variant' \
)\
`);
		const variantValRow = await this.getDb().sqlOne(`\
select \
characteristic_id \
from \
characteristic_variant_val \
where \
characteristic_id in (${this.getDb().escapeIn(this.getParam('id'))}) \
and rel_type = 'variant' \
limit 1\
`
		);
		if (variantValRow) {
			this.alertWarning(this.getI18n().__('One of the removing items is in variant - it cannot be removed.'));
		} else {
			this.alertSuccess(this.getI18n().__('Selected items were successfully removed.'));
		}

		this.json({});
	}
}