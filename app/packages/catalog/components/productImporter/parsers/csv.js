import fs from 'fs';
import _ from 'underscore';
import {Iconv} from 'iconv';
import csvParser from 'csv-parse';
import transform from 'stream-transform';
import BasicSheetParser from './sheet/basicParser';

export default class ProductImportParserCsv extends BasicSheetParser {
	constructor(filePath, settings) {
		super(filePath, settings);

		this.readStream = null;
	}

	async getFirstRows(qty = 3) {
		return new Promise((resolve, reject) => {
			const onFinish = (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			};

			this.getParsingPipe(this.filePath)
				.pipe(this.getFirstRowsStream(qty, onFinish))
				.on('error', reject)
			;
		});
	}

	async parse(saveRowCb) {
		return new Promise((resolve, reject) => {
			const onFinish = (err, result) => {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			};

			this.getParsingPipe(this.filePath)
				.pipe(this.getSaveStream(saveRowCb, onFinish))
				.on('error', reject)
			;
		});
	}

	getParsingPipe(filePath) {
		let sourceStream = this.getSourceStream(filePath);
		const parserStream = this.getParserStream();

		if (this.needChangeEncoding()) {
			const iconvStream = this.getIconv();
			sourceStream = sourceStream.pipe(iconvStream);
		}

		return sourceStream.pipe(parserStream);
	}

	getSourceStream(filePath) {
		this.readStream = fs.createReadStream(filePath);

		return this.readStream;
	}

	getParserStream() {
		const parser = csvParser(this.getParserOptions());

		// parser.on('error', e => {
		// 	const err = new Error(`Cant't parse CSV file: ${e.message}`);
		// 	//@ts-ignore
		// 	err.resolve = true;
		// 	return this.deferredMain.reject(err);
		// });

		return parser;
	}

	getFirstRowsStream(qty = 3, onFinish) {
		const out = [];
		const func = (row, callback) => {
			out.push(row);

			if (out.length >= qty) {
				this.readStream.close();
			}

			return callback(null, row);
		};

		//@ts-ignore
		const firstRowsStream = transform(func, {
			parallel: 1,
			consume: true
		});

		firstRowsStream.on('error', e => onFinish(e));

		this.readStream.on('close', () => onFinish(null, out.slice(0, qty)));

		return firstRowsStream;
	}

	getSaveStream(saveRowCb, onFinish) {
		let qtyProcessed = 0;
		const skipFirst = this.settings.skip_first_rows;
		const {mappingIndexes, mapping} = this.getMappingData();

		const onCsvRow = async (row, onCsvRowParsed) => {
			qtyProcessed++;

			if (skipFirst && (skipFirst >= qtyProcessed)) {
				onCsvRowParsed(null, row);
				return;
			}

			const data = this.prepareDataRow(mapping, mappingIndexes, row);

			if (data === false) {
				onCsvRowParsed(null, row);
				return;
			}

			try {
				await saveRowCb(data, qtyProcessed);
				onCsvRowParsed(null, row);
			} catch (e) {
				onCsvRowParsed(e, null);
			}
		};

		//@ts-ignore
		const saveStream = transform(onCsvRow, {
			parallel: 1,
			consume: true
		});

		// saveStream.on('error', e => {
		// 	return this.deferredMain.reject(e);
		// });

		saveStream.on('end', () => onFinish());
		return saveStream;
	}

	getIconv() {
		const fromEncoding = (() => {
			switch (this.settings.encoding) {
				case 'cp1251': return 'CP1251';
				case 'koi8-r': return 'KOI8-R';
				case 'MacCyrillic': return 'MacCyrillic';
				case 'utf-16le': return 'UTF-16LE';
				default: throw new Error('Unknown encoding');
			}
		})();

		const iconv = new Iconv(fromEncoding, 'UTF-8');

		// iconv.on('error', e => {
		// 	return this.deferredMain.reject(e);
		// });

		return iconv;
	}

	needChangeEncoding() {
		if (!this.settings.encoding || (this.settings.encoding === 'utf8')) {
			return false;
		} else {
			return true;
		}
	}

	getParserOptions() {
		const options = _.defaults(this.settings.csvDelimiters, {
			skip_lines_with_error: true,
			bom: true,
			relax_column_count: true
		});

		if (options.delimiter === 'tab') {
			options.delimiter = '\t';
		}

		return options;
	}
}