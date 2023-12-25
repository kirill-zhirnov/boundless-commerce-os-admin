import GridWidget from '../../system/widgets/grid.client';
import _ from 'underscore';

export default class ImportResultsGrid extends GridWidget {
	initGrid() {
		this.collection = this.url('catalog/admin/import/resultCollection');
		this.idAttribute = 'log_id';

		this.columns = [
			{
				name: 'started',
				label : this.__('Started at'),
				cell : 'html',
				filter: false,
				html : (column, model) => {
					return model.get('started_at');
				}
			},
			{
				name: 'fileName',
				label : this.__('File name'),
				cell : 'html',
				filter: false,
				sortable : false,
				html : (column, model) => {
					if (model.get('file_name')) { return model.get('file_name'); } else { return this.__('Unknown'); }
				}
			},
			{
				name: 'type',
				label : this.__('Type'),
				cell : 'html',
				filter: false,
				sortable : false,
				html : (column, model) => {
					let out;
					switch (model.get('run')) {
						case 'once':
							if (model.get('source_type') === 'file') {
								out = this.__('File');
							} else {
								out = this.__('URL');
							}
							break;
						case 'cron':
							out = this.__('By schedule');
							break;
					}

					return out;
				}
			},
			{
				name: 'status',
				label : this.__('Status'),
				cell : 'html',
				filter: false,
				sortable : false,
				html : (column, model) => {
					switch (model.get('status')) {
						case 'success': return this.__('Success');
						case 'error': return this.__('Error');
						default: return '';
					}
				}
			},
			{
				name: 'result',
				label : this.__('Result'),
				cell : 'html',
				filter: false,
				sortable : false,
				customClass : 'small',
				html : (column, model) => {
					const res = _.defaults(model.get('result'), {
						appendedVariants: 0,
						updatedVariants: 0,
						categoryInserted: 0,
						categoryUpdated: 0,
						imagesSkipped: 0,
						imagesUploaded: 0
					});

					let out = '';
					switch (model.get('status')) {
						case 'success':
							out = `
								<p>
									<b>${this.__('Products')}:</b><br/>
									${this.p__('import', 'Created')}: ${res.inserted},
									${this.p__('import', 'Updated')}: ${res.updated},
									${this.__('Skipped by tariff limit')}: ${res.skipped}
								</p>
								<p>
									<b>${this.__('Categories')}:</b><br/>
									${this.p__('import', 'Created')}: ${res.categoryInserted},
									${this.p__('import', 'Updated')}: ${res.categoryUpdated}
								</p>
								<p>
									<b>${this.__('Variants')}:</b><br/>
									${this.p__('import', 'Created')}: ${res.appendedVariants},
									${this.p__('import', 'Updated')}: ${res.updatedVariants}
								</p>
								<p>
									<b>${this.__('Product images')}:</b><br/>
									${this.__('Uploaded')}: ${res.imagesUploaded},
									${this.__('Skipped by tariff limit')}: ${res.imagesSkipped}
								</p>
							`;
							break;

						case 'error':
							if (res.message) {
								out = res.message;
							} else {
								out = res;
							}
							break;
					}

					return out;
				}
			}
		];

		this.commonFilter.showRmStatus = false;
		this.showPagination = true;
		return this.commonButtons = null;
	}

	onActionEdit(model, $btn) {
		return this.getClientRegistry().getClientNav().url(this.url('catalog/admin/import/resultPage', {
			logId: model.attributes.log_id,
			importId: model.attributes.import_id
		})
		);
	}

	getFileName() {
		return __filename;
	}
}
