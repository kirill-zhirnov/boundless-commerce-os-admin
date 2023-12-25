import BasicAdminController from '../../../packages/system/controllers/admin';
import _ from 'underscore';
import extend from 'extend';
import * as exporterFactory from '../../dataProvider/exporterFactory';
import utils from '../../utils/server';

export default class GridResource extends BasicAdminController {
	init() {
		super.init();

		//		redefine this hash
		this.grid = {
			widget: null,
			provider: null,
			providerOptions: {},
			model: null,
			form: null,
			exporterWidget: null,
			essence: null,
			afterRmClb: null
		};
	}

	async actionIndex() {
		const dataProvider = await this.createDataProvider(this.grid.provider, this.grid.providerOptions);
		await dataProvider.validate();

		const data = await dataProvider.getTplData();
		this.widget(this.grid.widget, {data});
	}

	async actionCollection() {
		const dataProvider = await this.createDataProvider(this.grid.provider, this.grid.providerOptions);
		const result = await dataProvider.getData();

		this.json(result);
	}

	async actionBulkRm() {
		const model = this.getModel(this.grid.model);

		const id = this.getParam('id');
		if (!Array.isArray(id)) {
			this.rejectHttpError(400, 'Bad request');
			return;
		}

		const bunches = utils.splitArr(id, 300);
		for (const bunch of bunches) {
			const options = {
				where: {
					//@ts-ignore
					[model.primaryKeyAttribute]: bunch
				}
			};
			//@ts-ignore
			await model.safeDelete(options);
		}

		if (this.grid.essence) {
			await this.essenceChanged(this.grid.essence, [], 'bulkRm');
		}

		if (_.isFunction(this.grid.afterRmClb)) {
			await this.grid.afterRmClb.call(this, id);
		}

		//@ts-ignore
		if (model.options.deletedAt) {
			this.alertSuccess(this.__('Selected items were successfully archived.'));
		} else {
			this.alertSuccess(this.__('Selected items were successfully removed.'));
		}

		this.json({});
	}


	async actionBulkRestore() {
		const model = this.getModel(this.grid.model);

		const id = this.getParam('id');
		if (!Array.isArray(id)) {
			this.rejectHttpError(400, 'Bad request');
			return;
		}

		const bunches = utils.splitArr(id, 300);
		for (const bunch of bunches) {
			const options = {
				where: {
					//@ts-ignore
					[model.primaryKeyAttribute]: bunch
				}
			};

			//@ts-ignore
			await model.recover(options);
		}

		if (this.grid.essence) {
			await this.essenceChanged(this.grid.essence, [], 'bulkRestore');
		}

		this.alertSuccess(this.__('Selected items were successfully restored.'));
		this.json({});
	}

	async actionForm() {
		const params = {
			path: null,
			formOptions: {},
			tpl: 'form',
			settings: {},
			modalWidgetPath: null,
			data: {},
			title(data) {
				if (data.pk) {
					return this.__('Edit');
				} else {
					return this.__('Create');
				}
			}
		};

		if (_.isObject(this.grid.form)) {
			_.extend(params, this.grid.form);
		} else {
			params.path = this.grid.form;
		}

		if (!params.path) {
			throw new Error('You must specify formPath');
		}

		const formKit = this.createFormKit(params.path, params.formOptions);
		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			let data = await formKit.getWebForm();

			let title;
			if (_.isFunction(params.title)) {
				title = params.title.call(this, data);
			} else {
				({title} = params);
			}

			data = extend(true, data, params.data);
			return this.modal(params.tpl, data, title, params.modalWidgetPath, params.settings);
		}
	}

	async actionExport() {
		const dataProvider = await this.createDataProvider(this.grid.provider, this.grid.providerOptions, this.getParam('grid'));
		const widget = this.grid.exporterWidget ? this.grid.exporterWidget : this.grid.widget;
		const exporter = exporterFactory.make(this.getParam('export'), this, widget, dataProvider);

		await exporter.setup();
		await exporter.run();
	}
}
