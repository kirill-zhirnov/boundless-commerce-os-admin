import Csv from './exporter/csv';
import Excel from './exporter/excel';

export function make(type, controller, widget, dataProvider) {
	let exporter;
	switch (type) {
		case 'csv':
			exporter = new Csv(controller, widget, dataProvider);
			break;
		case 'excel':
			exporter = new Excel(controller, widget, dataProvider);
			break;
		default:
			throw new Error(`Unknown export type '${type}'`);
	}

	return exporter;
}