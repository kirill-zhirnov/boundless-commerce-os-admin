// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const numberToWords = pathAlias('@p-system/modules/numberToWords');

class PrintUtils {
	constructor(fontSize, lineWidth) {
		if (fontSize == null) { fontSize = 14; }
		this.fontSize = fontSize;
		if (lineWidth == null) { lineWidth = 70; }
		this.lineWidth = lineWidth;
	}

	assembleAddress(street, city, region, area) {
		let line = "";

		if (region != null) {
			line += `${region}, `;
		}

		if (area != null) {
			line += `${area}, `;
		}

		line += `${city}, ${street}`;

		return line;
	}

	splitAddressToLines(address, linesNum) {
		if (linesNum == null) { linesNum = 3; }
		const out = {};

		for (let i = 1, end = linesNum, asc = 1 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
			if (address.length === 0) {
				out[`line${i}`] = "";
			} else {
				out[`line${i}`] = this.makeAddressLine(address);
				address = `${address} `.replace(out[`line${i}`], "");
			}
		}

		if (address) {
			out.rest = address;
		}

		return out;
	}

	makeAddressLine(address) {
		address = address.split(" ");
		let line = "";

		for (let word of Array.from(address)) {
			if (`${line}${word}`.length < this.lineWidth) {
				line = `${line}${word} `;
			} else {
				return line;
			}
		}

		return line;
	}

	calcSumSize(line, lineWidth) {
		if (lineWidth == null) { ({
            lineWidth
        } = this); }
		if (line.length <= lineWidth) {
			return this.fontSize;
		} else if (line.length <= (lineWidth + 10)) {
			return this.fontSize - 2;
		} else {
			return this.fontSize - 4;
		}
	}

	turnNumberToWords(number) {
		return numberToWords(number);
	}

	setFontSize(fontSize) {
		this.fontSize = fontSize;
	}

	setLineWidth(lineWidth) {
		this.lineWidth = lineWidth;
	}

	prepareAddressFields(row) {
		if (row.city_id) {
			return row;
		}
		
		if (row.custom_city) {
			row.city_title = row.custom_city;
		}
		
		if (row.custom_region_title) {
			row.region_title = row.custom_region_title;
		}

		if (row.custom_country_title) {
			row.country_title = row.custom_country_title;
		}

		return row;
	}
}


module.exports = PrintUtils;
