import xlsx from 'xlsx';
import BasicSheetParser from './sheet/basicParser';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default class ProductImportParserExcel extends BasicSheetParser {
	constructor() {
		//@ts-ignore
		super(...arguments);

		this.sheet = null;

		//		Array of column's ids, e.g.: ['A', 'B', 'C' ...]
		this.columnsList = null;
		this.rowsNumber = null;

		this.currentRow = 1;
	}

	getFirstRows(qty) {
		if (qty == null) {qty = 3;}
		this.setup();

		const outData = [];

		while (this.hasNextRow() && (qty > 0)) {
			outData.push(this.getNextRow());
			qty--;
		}

		return outData;
	}

	async parse(saveRowCb) {
		this.setup();

		const {mappingIndexes, mapping} = this.getMappingData();

		while (this.hasNextRow()) {
			const row = this.getNextRow();
			const data = this.prepareDataRow(mapping, mappingIndexes, row);

			if (data === false) {
				continue;
			}

			await saveRowCb(data);
		}
	}

	setup() {
		if (this.settings.skip_first_rows) {
			this.currentRow = this.settings.skip_first_rows + 1;
		}

		this.loadSheet();
		return this.getRange();
	}

	getNextRow() {
		const outRow = [];
		this.columnsList.forEach(letter => {
			if (this.sheet[`${letter}${this.currentRow}`]) {
				return outRow.push(this.sheet[`${letter}${this.currentRow}`].v);
			} else {
				return outRow.push('');
			}
		});

		this.currentRow++;

		return outRow;
	}

	hasNextRow() {
		if (this.currentRow <= Number(this.rowsNumber)) {
			return true;
		} else {
			return false;
		}
	}

	getRange() {
		const range = this.sheet['!ref'].split(':');
		const regExp = /([A-Z]+)(\d+)/;

		const res = range[1].match(regExp);

		this.rowsNumber = res[2];
		this.columnsList = this.getColumnsList(res[1]);

	}

	loadSheet() {
		try {
			const workbook = xlsx.readFile(this.filePath);
			const firstSheetName = workbook['SheetNames'][0];
			return this.sheet = workbook['Sheets'][firstSheetName];
		} catch (e) {
			const err = new Error('Can\'t parse Excel file');
			//@ts-ignore
			err.resolve = true;
			throw err;
		}
	}

	//	Last column - ID of last column, e.g. 'G'
	getColumnsList(lastColumn) {
		let i, letterPos;
		let asc, end;
		let asc1, end1;
		let colPos = 0;
		const lastColIndex = lastColumn.length - 1;

		for (i = 0, end = lastColumn.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
			const letter = lastColumn[i];
			letterPos = alphabet.indexOf(letter);

			if (i === lastColIndex) {
				colPos += letterPos + 1;
			} else {
				colPos += (letterPos + 1) * alphabet.length;
			}
		}

		if (colPos > 100) {
			colPos = 100;
		}

		const out = [];
		let prefix = '';
		let aphabetNumber = 0;

		for (i = 0, end1 = colPos, asc1 = 0 <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
			letterPos = i - (aphabetNumber * alphabet.length);
			out.push(`${prefix}${alphabet[letterPos]}`);

			if ((letterPos > 0) && ((letterPos % (alphabet.length - 1)) === 0)) {
				prefix = alphabet[aphabetNumber];
				aphabetNumber++;
			}
		}

		return out;
	}
}