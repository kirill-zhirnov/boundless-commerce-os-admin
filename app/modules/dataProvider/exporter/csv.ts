import BasicExporter from './basic';
import csvStringify from 'csv-stringify';
import Backbone from '../../backbone/index.client';

export default class Csv extends BasicExporter {
	async run() {
		this.expressRes.set({
			'Content-Type': 'application/csv;charset=UTF-8',
			'Content-Disposition': `attachment;filename="${this.getFileName('csv')}"`
		});

		const csvStream = csvStringify({
			//@ts-ignore
			delimiter: ';',
			quotedString: true
		});
		csvStream.pipe(this.expressRes);
		csvStream.on('finish', () => {
			return this.expressRes.end();
		});

		csvStream.write(this.columns.getHeader());

		const options = this.getModelOptions();

		//@ts-ignore
		const Model = Backbone.My.Model;
		const data = await this.dataProvider.getData();
		for (const row of Array.from(data[1])) {
			csvStream.write(this.columns.renderRow(new Model(row, options)));
		}

		return csvStream.end();
	}
}