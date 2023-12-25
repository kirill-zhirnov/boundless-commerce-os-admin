import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class UsersGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('auth/admin/users/collection');
		this.idAttribute = 'person_id';
		this.cssGridWrapper = 'col-md-10 offset-md-1';

		this.columns = [
			{
				label: this.__('Name & Email'),
				clickable: this.data.isOwner,
				name: 'name',
				cell: 'html',
				html: (column, model) => {
					let out = '';
					const first_name = model.get('first_name');
					const last_name = model.get('last_name');
					const email = model.get('email');
					if (first_name || last_name) out += gHtml.tag('p', {class: 'mb-0'}, `${first_name || ''} ${last_name || ''}`);
					if (email) out += gHtml.tag('p', {class: 'mb-0'}, email);
					return out;
				}
			},
			{
				label: this.__('Role'),
				name: 'role_title',
				clickable: this.data.isOwner,
				filter: false,
				sortable: false,
				customClass: 'text-center',
				cell: 'html',
				html: (column, model) => {
					if (!model) {
						return;
					}

					return `${model.get('role_title') || this.__('Other')}`;
				}
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{
							type: 'rm',
							attrs: {
								disabled: !this.data.isOwner,
								'data-action': this.data.isOwner ? 'rm' : ''
							}
						}
					],

					removed: [
						{
							type: 'restore',
							attrs: {
								disabled: !this.data.isOwner,
								'data-action': this.data.isOwner ? 'restore' : ''
							}
						}
					],
					empty: [],
				},
				scope(model) {
					if (model.get('is_owner')) return 'empty';
					return model.get('deleted_at') !== null ? 'removed' : 'normal';
				}
			}
		];

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Add new admin user'),
					attrs: {
						'data-action': this.data.isOwner ? 'add' : '',
						disabled: !this.data.isOwner
					}
				},
			]
		};
	}

	getFileName() {
		return __filename;
	}
}