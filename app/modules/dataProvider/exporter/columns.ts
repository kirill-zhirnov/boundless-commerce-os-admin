import Backgrid from 'backgrid';
import _ from 'underscore';
import stripTags from 'striptags';
import validator from '../../validator/validator';
import {AllHtmlEntities as Entities} from 'html-entities';
import GridWidget from '../../../packages/system/widgets/grid.client';

export default class Columns {
	protected widget: GridWidget;
	protected columns: Array<any>; //FIXME определить тип для колонок

	constructor(widget: GridWidget) {
		this.widget = widget;

		this.setupColumns();
	}

	getHeader() {
		const out = [];
		for (const column of this.columns) {
			if (column.label != null) {
				out.push(column.label);
			} else {
				out.push(column.name);
			}
		}

		return out;
	}

	renderRow(model) {
		const out = [];
		const entities = new Entities();

		for (const columnProps of this.columns) {
			let val;
			const column = new Backgrid.Column(columnProps);

			//			default value for strip tags
			let columnStripTags = false;

			switch (columnProps.cell) {
				case 'string':
					val = model.get(columnProps.name);
					break;

				case 'html':
					columnStripTags = true;
					val = this.renderHtmlColumn(column, columnProps, model);
					break;
			}

			if ((val === null) || _.isUndefined(val)) {
				val = '';
			}

			if (!(val instanceof Date)) val = String(val);

			if ('stripTags' in columnProps) {
				if (_.isFunction(columnProps.stripTags)) {
					columnStripTags = columnProps.stripTags.call(this.widget, column, model);
				} else {
					columnStripTags = columnProps.stripTags;
				}
			}

			if (columnStripTags) {
				val = stripTags(val);

				//				replace &nbsp; , &lt; to space, <, etc:
				val = entities.decode(val);

				//				need to replace \r in order to avoid _x000d_ symbols
				val = val.replace(/\r/g, '\n');
				val = val.replace(/\n+/g, '\n');
				val = validator.trim(val);
			}

			out.push(val);
		}

		return out;
	}

	renderHtmlColumn(column, columnProps, model) {
		if (!_.isFunction(columnProps.html)) {
			return '';
		}

		const res = columnProps.html.call(this.widget, column, model);

		return res;
	}

	setupColumns() {
		const columns = this.widget.columns || [];

		this.columns = [];
		for (const column of columns) {
			if (!column.cell) {
				column.cell = 'string';
			}

			if (['string', 'html'].indexOf(column.cell) === -1) {
				continue;
			}

			if ((['string'].indexOf(column.cell) !== -1) && !column.name) {
				continue;
			}

			this.columns.push(column);
		}
	}
}