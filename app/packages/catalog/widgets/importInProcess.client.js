import Widget from '../../../modules/widget/widget.client';
import ajax from '../../../modules/ajax/kit.client';

export default class ImportInProcess extends Widget {
	attributes() {
		return {
			class: 'import-csv-in-process'
		};
	}

	run() {
		return this.render('importInProcess');
	}

	runLazyInit() {
		return this.checkImportStatus();
	}

	async checkImportStatus() {
		const result = await ajax.post(this.url('catalog/admin/import/getImportStatus'), {
			importId: this.data.importId,
			logId: this.data.logId
		}, {hidden: true});

		if ((result.status === 'success') || (result.status === 'error')) {
			return this.getClientRegistry().getClientNav().url(this.url('catalog/admin/import/resultPage', {
				importId: this.data.importId,
				logId: this.data.logId
			})
			);
		} else if (result.status === 'awaiting_setup') {
			return this.getClientRegistry().getClientNav().url(this.url('catalog/admin/import/setupTableImport', {
				importId: this.data.importId,
				logId: this.data.logId
			})
			);
		} else {
			if (this.$el.data('widget')) {
				setTimeout(() => this.checkImportStatus(), 1000);
			}
		}
	}

	getFileName() {
		return __filename;
	}
}