import validator from '../../../../../../modules/validator/validator';
import _ from 'underscore';

export default class SheetBasicParser {
	constructor(filePath, settings) {
		this.filePath = filePath;
		if (settings == null) {settings = {};}
		this.settings = settings;
	}

	prepareDataRow(mapping, mappingIndexes, row) {
		const data = {};
		let forceGroup = null;

		mappingIndexes.forEach(i => {
			let cellVal = null;
			if (row[i] !== null) {
				cellVal = validator.trim(String(row[i]));
			}

			if ((cellVal === null) || (cellVal === '')) {
				return;
			}

			if (mapping[i] === 'image') {
				if (!data.images) {
					data.images = [];
				}

				return data.images.push({src: cellVal});
			} else if (_.isObject(mapping[i]) && mapping[i].type) {
				const colProps = mapping[i];
				if (colProps.type === 'characteristic') {
					if (!data.params) {
						data.params = [];
					}

					data.params.push({
						name: colProps.characteristicName,
						value: cellVal
					});

					return forceGroup = colProps.groupTitle;
				}
			} else {
				return data[mapping[i]] = cellVal;
			}
		});

		if (forceGroup) {
			data.commodity_group = forceGroup;
		}

		if (Object.keys(data).length === 0) {
			return false;
		}

		return data;
	}

	getMappingData() {
		const mappingIndexes = [];
		const {
			mapping
		} = this.settings;

		mapping.forEach((val, index) => {
			if (val != null) {
				mappingIndexes.push(index);
			}
		});

		return {mappingIndexes, mapping};
	}
}