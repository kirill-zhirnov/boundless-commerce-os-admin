import GridWidget from '../../system/widgets/grid.client';
import modalKit from '../../../modules/modal/kit.client';
import escape from 'escape-html';

export default class CharacteristicGrid extends GridWidget {
	className() {
		let out = super.className();
		out += ' characteristics-grid';

		return out;
	}

	initGrid() {
		let url = 'catalog/admin/characteristic/collection';

		if (this.data.attrs && this.data.attrs.groupId) {
			url += `?groupId=${this.data.attrs.groupId}`;
		}

		this.collection = this.url(url);
		this.idAttribute = 'characteristic_id';
		this.columns = [
			{
				cell: 'bulkCheckbox'
			},
			{
				label: this.__('Attribute Title'),
				name: 'title',
				cell: 'html',
				sortable: false,
				html: (column, model) => {
					let title;
					const escapedTitle = escape(model.get('title'));

					//					switch model.get('system_type')
					//						when 'length', 'width', 'height'
					//							escapedTitle += " " + @__('(cm.)')
					//
					//						when 'weight'
					//							escapedTitle += " " + @__('(kg.)')

					if (model.get('is_folder')) {
						title = `
							<span class="fa fa-folder-open-o"></span>&nbsp;&nbsp;${escapedTitle}
						`;
					} else if (model.get('parent_id')) {
						title = `
							<div class="has-parent">${escapedTitle}</div>
							<div class="text-end">
								<em><small>${model.get('parent_title')}</small></em>
							</div>
						`;
					} else {
						title = `${escapedTitle}`;
					}

					return title;
				}
			},
			{
				label: this.__('JSON key'),
				name: 'alias',
				sortable: false
			},
			{
				label: this.__('Type'),
				name: 'type',
				sortable: false
			},
			{
				label: this.__('Sort'),
				name: 'sort',
				sortable: false,
				filter: false
			},
			{
				cell: 'buttons',
				buttons: [
					{type: 'rm'}
				]
			}
		];

		this.commonButtons = {
			buttons: [
				{
					label: this.__('Add group'),
					icon: 'fa fa-folder-open-o',
					class: 'btn btn-outline-secondary m-1',
					attrs: {
						'data-action': 'addFolder'
					}
				},
				{
					type: 'add',
					label: this.__('Add Attribute'),
					icon: 'fa fa-info-circle',
					class: 'btn btn-outline-secondary m-1',
				}
			]
		};

		this.bulkButtons = {
			buttons: [
				{type: 'rm'}
			]
		};

		this.commonFilter = {showRmStatus: false};
	}

	onCommonActionAddFolder() {
		const url = `${this.getStaticUrl('folderForm', 'folderForm')}?groupId=${this.data.attrs.groupId}`;

		return modalKit.createRemote(url);
	}

	onCommonActionAdd() {
		const url = `${this.getFormUrl()}?groupId=${this.data.attrs.groupId}`;

		return modalKit.createRemote(url);
	}

	onActionEdit(model) {
		const basicUrl = model.get('is_folder') ? this.getStaticUrl('folderForm', 'folderForm') : this.getFormUrl();

		const url = `${basicUrl}?groupId=${this.data.attrs.groupId}&pk=${model.id}`;
		return modalKit.createRemote(url);
	}

	getFileName() {
		return __filename;
	}
}