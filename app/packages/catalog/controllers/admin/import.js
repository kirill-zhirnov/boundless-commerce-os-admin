import BasicAdmin from '../../../system/controllers/admin';
import _ from 'underscore';
import helpCatalog from '../../../../modules/help';

export default class ImportController extends BasicAdmin {
	actionIndex() {
		this.setPage('title', this.__('Import catalog'));
		this.render('index', {
			help: helpCatalog.get('import')
		});
	}
/*
	async actionByUrl() {
		const formKit = this.createFormKit('@p-catalog/forms/import/byUrl', {
			runType: this.getParam('run')
		}, {
			success: (safeAttrs, pk, formKit) => {
				this.metaRedirect(this.url('catalog/admin/import/waitingForImport', {
					importId: pk,
					logId: formKit.form.getImportLogId()
				})
				);

				return this.json({
					pk,
					closeModal: true
				});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();
			this.modal('url', {data}, this.__('Import by file url'));
		}
	}
*/
	/*
	async actionSchedule() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/importSchedule');
		const data = await dataProvider.getTplData();
		this.widget('catalog.importScheduleGrid.@c', {
			data
		});
	}*/

	async actionScheduleCollection() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/importSchedule');
		const result = await dataProvider.getData();
		this.json(result);
	}

	async actionScheduleRm() {
		//@ts-ignore
		await this.getDb().model('productImport').deleteImportSchedule(this.getInstanceRegistry().getInstanceInfo().instance_id, this.getParam('id'));
		this.alertSuccess(this.__('Selected items were successfully archived.'));
		this.json({});
	}

	async actionScheduleRestore() {
		const qty = await this.getDb().model('productImport').count({
			where: {
				run: 'cron',
				deleted_at: null
			}
		});

		if (qty >= 2) {
			this.alertDanger(this.__('Only 2 rules per account allowed.'));
			return;
		} else {
			this.alertSuccess(this.__('Selected items were successfully restored.'));
			//@ts-ignore
			await this.getDb().model('productImport').restoreImportSchedule(this.getInstanceRegistry().getInstanceInfo().instance_id, this.getParam('id'));
		}
		this.json({});
	}

	async postActionUpload() {
		const formKit = this.createFormKit('@p-catalog/forms/import/uploader', {}, {
			success: (safeAttrs, pk, formKit) => {
				const uploadedFile = formKit.form.getUploadedFile();

				switch (uploadedFile.type) {
					case 'csv':
						this.getAnswer().setMetaAction('modalRedirect');
						this.getAnswer().setMetaData(this.url('catalog/admin/import/csvDelimiter', {importId: uploadedFile.import_id}));
						break;
					case 'excel':
						this.metaRedirect(this.url('catalog/admin/import/setupTableImport', {importId: uploadedFile.import_id}));
						break;
					case 'yml':
						this.getAnswer().setMetaAction('modalRedirect');
						this.getAnswer().setMetaData(this.url('catalog/admin/import/yml/setup', {
							importId: uploadedFile.import_id
						}));
						break;
					default:
						throw new Error(`Unknown file type '${uploadedFile.type}'.`);
				}

				return this.json({pk: uploadedFile.import_id});
			},

			// error: formKit => {
			// 	this.getAnswer().setPerformWithExpress(false);

			// 	//				set status directly to express response
			// 	this.getFrontController().getResponse().status(400);
			// 	this.getFrontController().getResponse().json(formKit.form.getSingleError());

			// 	return this.resolve();
			// }
		});

		await formKit.process();
	}

	async actionCsvDelimiter() {
		const formKit = this.createFormKit('@p-catalog/forms/import/csvDelimiters', {
			importId: this.getParam('importId')
		}, {
			successRedirect: this.url('catalog/admin/import/setupTableImport', {importId: this.getParam('importId')}),
			forceCloseModal: true,
			successMsg: false
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			_.extend(data.buttons, {
				predefinedButtons: {
					save: {
						title: this.__('Continue'),
						icon: 'fa fa-play'
					}
				},
				buttons: ['save']
			});

			this.modal('csvDelimiter', data, this.__('Setup CSV delimiters'), null, {
				setBsConfig: {
					backdrop: 'static'
				}
			});
		}
	}

	async actionSetupTableImport() {
		const productImport = await this.findImport();
		this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/import/index'));

		const formKit = this.createFormKit('@p-catalog/forms/import/tableSetup', {
			productImport
		}, {
			success: (safeAttrs, pk, formKit) => {
				let url;
				if (productImport.run === 'once') {
					url = this.url('catalog/admin/import/waitingForImport', {
						importId: this.getParam('importId'),
						logId: formKit.form.getImportLogId()
					});
				} else {
					this.alertSuccess(this.__('Form was successfully saved.'));
					url = this.url('catalog/admin/import/index');
				}

				this.metaRedirect(url);

				return this.json({pk});
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			//@ts-ignore
			data.buttons = data.buttons || {};
			//@ts-ignore
			Object.assign(data.buttons, {
				predefinedButtons: {
					save: {
						icon: 'fa fa-cloud-upload',
						title: this.__('Start import')
					}
				}
			});

			this.setPage('title', this.__('Setup import'));
			this.render('setupTableImport', {data});
		}
	}

	async actionWaitingForImport() {
		// remove find import?
		const row = await this.findImport();
		this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/import/index'));
		this.setPage('title', this.__('Import is in process'));

		this.widget('catalog.importInProcess.@c', {
			data: {
				importId: row.import_id,
				logId: row.productImportLogs[0].log_id
			}
		});
	}

	async actionGetImportStatus() {
		const row = await this.findImport();
		if ((row.type === 'yml') && (row.run === 'cron') && (row.productImportLogs[0].status === 'ready_for_import')) {
			this.alertSuccess(this.__('Form was successfully saved.'));
			this.metaRedirect(this.url('catalog/admin/import/index'));
		}

		this.json({status: row.productImportLogs[0].status});
	}

	async actionResultGrid() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/importResults');
		const data = await dataProvider.getTplData();

		this.widget('catalog.importResultsGrid.@c', {data});
	}

	async actionResultCollection() {
		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/admin/importResults');
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionResultPage() {
		const data = await this.findImport();
		this.getAnswer().setLayoutData('currentMenuUrl', this.url('catalog/admin/import/index'));
		this.setPage('title', this.__('Import result'));

		const productImportLog = data.productImportLogs[0];

		if (productImportLog) {
			_.defaults(productImportLog.result, {
				appendedVariants: 0,
				updatedVariants: 0,
				categoryInserted: 0,
				categoryUpdated: 0
			});
		} else {
			this.rejectHttpError(404, 'Not found!');
			return;
		}

		this.render('resultPage', {
			productImportLog
		});
	}

	findImport() {
		const options = {
			where: {
				import_id: this.getParam('importId')
			}
		};

		if (this.getParam('logId')) {
			options.include = [{
				model: this.getDb().model('productImportLog'),
				where: {
					log_id: this.getParam('logId')
				}
			}];
		}

		//@ts-ignore
		return this.getDb().model('productImport').findException(options);
	}
}