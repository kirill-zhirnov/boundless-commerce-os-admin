import Widget from '../../widget/widget.client';
import utils from '../../utils/common.client';
import Columns from './columns';
import Backbone from '../../backbone/index.client';
import BasicDataProvider from '..';
import BasicController from '../../controller/basic';
import {Response} from 'express';
import GridWidget from '../../../packages/system/widgets/grid.client';
import format from 'date-fns/format';

export default class BasicExporter {
	protected controller: BasicController;
	protected widgetName: GridWidget|string;
	protected dataProvider: BasicDataProvider;
	protected widget: GridWidget|null;
	protected columns: Columns|null;
	protected filePrefix: string|null;
	protected expressRes: Response|null;

	constructor(controller, widgetName, dataProvider) {
		//		Instance of Widget
		this.controller = controller;
		this.widgetName = widgetName;
		this.dataProvider = dataProvider;
		this.widget = null;
		this.columns = null;
		this.filePrefix = null;
		this.expressRes = null;
	}

	async setup() {
		this.dataProvider.turnOffPagination();

		await this.makeWidget();

		this.columns = new Columns(this.widget);

		this.filePrefix = this.controller.getParsedRoute().controller;

		// By default turn off perform.
		this.controller.getAnswer().setPerformWithExpress(false);
		this.expressRes = this.controller.getFrontController().getResponse();
	}

	run() {
		throw new Error('You should redefine method in a successor!');
	}

	async makeWidget() {
		await this.dataProvider.validate();

		const tplData = await this.dataProvider.getTplData();
		let widget;
		if (this.widgetName instanceof Widget) {
			widget = this.widgetName;
			//@ts-ignore
			widget.data = tplData;
		} else if (this.widgetName.substr(0, 1) === '@') {
			widget = this.controller.makeWidget(this.widgetName, {data: tplData});
		} else {
			widget = utils.createWidgetByName(this.widgetName, {
				frontController: this.controller.getFrontController(),
				data: tplData
			});
		}

		this.widget = widget;

		await widget.initGrid();
	}

	getModelConstr() {
		const options = {};
		if (this.widget.idAttribute) {
			Object.assign(options, {
				idAttribute: this.widget.idAttribute
			});
		}

		//@ts-ignore
		return Backbone.My.Model.extend(options);
	}

	getModelOptions() {
		const options = {};
		if (this.widget.idAttribute) {
			Object.assign(options, {
				idAttribute: this.widget.idAttribute
			});
		}
		return options;
	}

	getFileName(extension) {
		return `${this.filePrefix}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.${extension}`;
	}
}