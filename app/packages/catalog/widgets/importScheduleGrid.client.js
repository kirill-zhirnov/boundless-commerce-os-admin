import GridWidget from '../../system/widgets/grid.client';
import _ from 'underscore';
import modalKit from '../../../modules/modal/kit.client';

export default class ImportScheduleGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('catalog/admin/import/scheduleCollection');
		this.idAttribute = 'import_id';

		_.extend(this.staticUrls, {
			'bulkRm': this.url('catalog/admin/import/scheduleRm'),
			'bulkRestore': this.url('catalog/admin/import/scheduleRestore')
		});

		this.columns = [
			{
				name: 'url',
				label : this.getI18n().__('URL'),
				cell : 'html',
				filter: false,
				sortable : false,
				html : (column, model) => {
					return model.get('url');
				}
			},
			{
				name: 'type',
				label : this.getI18n().__('Type'),
				cell : 'html',
				filter: false,
				sortable : false,
				html : (column, model) => {
					return model.get('type');
				}
			},
			{
				name: 'schedule',
				label : this.getI18n().__('Run schedule'),
				cell : 'html',
				filter: false,
				sortable : false,
				html : (column, model) => {
					let out;
					switch (model.get('schedule')) {
						case 'every_1_hour':
							out = this.getI18n().__('Every hour');
							break;
						case 'every_2_hours':
							out = this.getI18n().__('Every 2 hours');
							break;
						case 'every_1_day':
							out = this.getI18n().__('Once a day');
							break;
					}

					return out;
				}
			},
			{
				cell : 'buttons',
				buttons : {
					normal: [{type : 'rm'}],

					removed: [{type: 'restore'}]
				},

				scope(model) {
					if (model.get('deleted_at') != null) { return 'removed'; } else { return 'normal'; }
				}
			}
		];

		this.showPagination = false;
		return this.commonButtons = {
			buttons: [{
				label : this.getI18n().__('Create'),
				icon : 'glyphicon glyphicon-save',
				class : 'btn btn-default',
				attrs : {
					'data-action': 'addImport'
				}
			}]
		};
	}

	onActionEdit(model, $btn) {
		return modalKit.createRemote(this.url('catalog/admin/import/byUrl', {pk: model.id, run: 'cron'}));
	}

	onCommonActionAddImport() {
		return modalKit.createRemote(this.url('catalog/admin/import/byUrl', {run: 'cron'}));
	}

	getFileName() {
		return __filename;
	}
}