import BasicExporter from './basic';
import xlsx from 'xlsx';
import Backbone from '../../backbone/index.client';

export default class Excel extends BasicExporter {
	async run() {
		this.expressRes.set({
			'Content-Type': 'application/vnd.ms-excel',
			'Content-Disposition': `attachment;filename="${this.getFileName('xlsx')}"`
		});

		const options = this.getModelOptions();

		//@ts-ignore
		const Model = Backbone.My.Model;
		const data = await this.dataProvider.getData();

		// this.expressRes.send(data);
		// return;

		const aoa = [this.columns.getHeader()];

		for (const row of Array.from(data[1])) {
			aoa.push(this.columns.renderRow(new Model(row, options)));
		}

		const wbout = xlsx.write({
			SheetNames: ['export'],
			Sheets: {
				'export': xlsx.utils.aoa_to_sheet(aoa)
			}
		}, {
			bookType: 'xlsx',
			type: 'buffer'
		});

		return this.expressRes.send(wbout);
	}
}