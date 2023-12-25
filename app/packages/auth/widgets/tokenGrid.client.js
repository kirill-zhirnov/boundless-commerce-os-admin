import GridWidget from '../../system/widgets/grid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class TokenGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('auth/admin/token/collection');
		this.idAttribute = 'token_id';
		this.cssGridWrapper = 'col-md-10 offset-md-1';

		this.columns = [
			{
				label: this.__('Application name'),
				name: 'name',
			},
			{
				name: 'token',
				label: this.__('Permanent token'),
				clickable: false,
				filter: false,
				sortable: false,
				cell: 'html',
				html: (column, model) => {
					if (!model) return;

					const permanentToken = model.get('permanent_token');
					const requireExp = model.get('require_exp');

					if (requireExp || !permanentToken)
						return '';

					return `
						${gHtml.textField('', permanentToken, {class: 'form-control', readonly: 'readonly'})}
						${gHtml.tag('div', {class: 'text-muted small mt-1'}, this.__('Select all & Copy token'))}
					`;
				}
			},
			{
				name: 'can_manage',
				label: this.__('Management rights'),
				clickable: true,
				filter: false,
				sortable: false,
				cell: 'html',
				html: (column, model) => {
					if (!model) return;

					return gHtml.tag(
						'div',
						{class: 'text-center'},
						model.get('can_manage') ? this.__('Yes') : this.__('No')
					);
				}
			},
			{
				cell: 'buttons',
				buttons: {
					normal: [
						{type: 'edit'},
						{type: 'rm'}
					],

					removed: [
						{type: 'restore'}
					]
				},
				scope(model) {
					return model.get('deleted_at') !== null ? 'removed' : 'normal';
				}
			}
		];

		this.commonButtons = {
			buttons: [
				{
					type: 'add',
					label: this.__('Create new token')
				}
			]
		};
	}

	getFileName() {
		return __filename;
	}
}