import Form from '../../../../modules/form/index';
import _ from 'underscore';
import ProductImporter from '../../components/productImporter';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';

const unlink = promisify(fs.unlink);

const charactRegExp = /^charact_\d+$/;

export default class TableSetup extends Form {
	constructor(options) {
		super(options);

		this.productImport = options.productImport;
		this.importer = new ProductImporter(this.getInstanceRegistry(), this.productImport);
		this.importLogId = null;
		this.characteristicsByGroup = {};
	}
	initialize() {
	}

	getRules() {
		return [
			['skip_first_rows, importLogId', 'isNum'],
			['skip_first_rows', 'validateFirstRows'],
			['only_insert', 'safe'],
			['mapping', 'validateMappingSet'],
			['mapping', 'inOptions', {options: 'mappingColumns', multiple: true}],
			['mapping', 'validateCharactInSingleGroup'],
			['only_update', 'validateOnlyUpdate'],
			['detect_variants_by', 'inOptions', {options: 'detectVariants'}],
			['detect_variants_by', 'validateDetectVariants']
		];
	}

	async save() {
		const safeAttrs = this.getSafeAttrs();
		//@ts-ignore
		const {importLogId, mapping, detect_variants_by} = safeAttrs;
		//@ts-ignore
		let {skip_first_rows, only_insert, only_update} = safeAttrs;

		this.importLogId = importLogId;

		if (skip_first_rows === '') {
			skip_first_rows = 1;
		}

		skip_first_rows--;
		only_insert = only_insert === '1';
		only_update = only_update === '1';

		for (let key = 0; key < mapping.length; key++) {
			const val = mapping[key];
			if (val === '') {
				mapping[key] = null;
				continue;
			}

			if (charactRegExp.test(val)) {
				const groupId = this.getGroupIdByCharacteristics(val);
				this.characteristicsByGroup[groupId];

				mapping[key] = {
					type: 'characteristic',
					characteristicId: this.characteristicsByGroup[groupId].characts[val].id,
					characteristicName: this.characteristicsByGroup[groupId].characts[val].title,
					groupTitle: this.characteristicsByGroup[groupId].title,
					groupId
				};
			}
		}

		const settings = _.extend({}, this.productImport.settings, {
			mapping,
			skip_first_rows,
			only_insert,
			only_update
		});

		if (detect_variants_by) {
			//@ts-ignore
			settings.detect_variants_by = detect_variants_by;
		}

		this.productImport.set('settings', settings);

		await this.productImport.save();

		await this.getDb().model('productImportLog').update({
			status: 'ready_for_import'
		}, {
			where: {
				log_id: importLogId
			}
		});
		await this.deleteLocalFile();
		await this.afterSave();
	}

	async deleteLocalFile() {
		const filePath = path.resolve(this.getInstanceRegistry().getDataPath(), this.productImport.file_path);
		if (fs.existsSync(filePath)) await unlink(filePath);
	}

	async afterSave() {
		if (this.productImport.run === 'once') {
			//@ts-ignore
			await this.getInstanceRegistry().getEventPublisher().publish('runCmd', {
				cmd: 'import',
				import_id: this.productImport.import_id,
				action: 'run',
				options: {
					//@ts-ignore
					detached: this.detached,
					stdio: 'ignore'
				}
			});
		} else {
			await this.importer.saveTask();
		}
	}

	async loadFirstRows() {
		try {
			const rows = await this.importer.getFirstRows(3);
			this.importLogId = this.importer.getImportLogId();
			return rows;
		} catch (e) {
			if (!e.resolve) {
				console.error(e);
			}

			this.productImport.status = 'error';
			try {
				await this.productImport.save();
				return false;
			} catch (e) {
				console.error(e);
				return false;
			}
		}
	}

	async getTplData() {
		const data = await super.getTplData();
		const rows = await this.loadFirstRows();

		//@ts-ignore
		data.firstRows = rows;
		//@ts-ignore
		data.importId = this.productImport.import_id;
		//@ts-ignore
		data.importLogId = this.importLogId;

		return data;
	}

	rawOptions() {
		return {
			mappingColumns: this.getMappingColumns(),
			detectVariants: [
				['', this.__('Do not detect variants.')],
				['offerGroupId', this.__('Detect by "group_id"')],
				['sku', this.__('Detect by sku')]
			]
		};
	}

	getImportLogId() {
		return this.importLogId;
	}

	async getMappingColumns() {
		let out = [
			['name', this.__('Product Title')],
			['sku', this.__('SKU')],
			['external_id', this.__('ID in external database')],
			['manufacturer', this.__('Manufacturer')],
			['country_of_origin', this.__('Country of origin')],
			['commodity_group', this.__('Product Type')],
			['category', this.__('Category')],
			['description', this.__('Description')],
			['image', this.__('Image url')],
		];

		//@ts-ignore
		await this.getModel('warehouse').checkWarehouseExists(this.getI18n(), this.getEditingLang().lang_id);
		//@ts-ignore
		const locationOptions = await this.getModel('inventoryLocation').getWarehouseOptions(this.getEditingLang().lang_id);
		for (let option of Array.from(locationOptions)) {
			out.push([`location_${option[0]}`, this.__('Stock at "%s"', [option[1]])]);
		}

		//@ts-ignore
		const priceOptions = await this.getModel('price').findAllOptions(this.getEditingLang().lang_id, this.getI18n());
		for (let option of Array.from(priceOptions)) {
			out.push([`price_${option[0]}`, option[1]]);
		}

		const groupParamOptions = await this.getCommodityGroupColOptions();
		out = out.concat(groupParamOptions);

		out.push(['offerGroupId', this.__('Group ID for product\'s variants')]);

		return out;
	}

	async getCommodityGroupColOptions() {
		this.characteristicsByGroup = {};

		//@ts-ignore
		await this.getModel('commodityGroup').findOrCreateDefault(this.getEditingLang().lang_id, this.getI18n());

		const rows = await this.getDb().sql(`
		select
			characteristic_id,
			commodity_group.group_id,
			vw_characteristic_grid.title as charact_title,
			commodity_group_text.title as group_title
		from
			vw_characteristic_grid
		inner join commodity_group using(group_id)
		inner join commodity_group_text on
			commodity_group_text.group_id = commodity_group.group_id
			and commodity_group_text.lang_id = vw_characteristic_grid.lang_id
		where
			vw_characteristic_grid.lang_id = :lang
			and vw_characteristic_grid.is_folder is false
			and commodity_group.deleted_at is null
		order by
			commodity_group_text.title asc,
			commodity_group.group_id asc,
			tree_sort asc
		`, {
			lang: this.getEditingLang().lang_id
		});
		for (let row of Array.from(rows)) {
			//@ts-ignore
			if (!(row.group_id in this.characteristicsByGroup)) {
				//@ts-ignore
				this.characteristicsByGroup[row.group_id] = {
					//@ts-ignore
					title: row.group_title,
					characts: {},
					options: []
				};
			}

			//@ts-ignore
			this.characteristicsByGroup[row.group_id].characts[`charact_${row.characteristic_id}`] = {
				//@ts-ignore
				id: row.characteristic_id,
				//@ts-ignore
				title: row.charact_title
			};

			//@ts-ignore
			this.characteristicsByGroup[row.group_id].options.push([`charact_${row.characteristic_id}`, row.charact_title]);
		}

		const out = [];
		Object.keys(this.characteristicsByGroup).forEach(groupId => {
			return out.push([this.characteristicsByGroup[groupId].title, this.characteristicsByGroup[groupId].options]);
		});

		return out;
	}

	async validateCharactInSingleGroup(value, options, field) {
		if (this.hasErrors(field)) return;

		let hasCharact = false;
		let hasCommodityGroup = false;
		let charactGroupId = null;

		//		get options to populate @characteristicsByGroup
		await this.getOptions('mappingColumns');
		for (let column of Array.from(value)) {
			if (column === 'commodity_group') {
				hasCommodityGroup = true;
				continue;
			}

			if (charactRegExp.test(column)) {
				hasCharact = true;

				const groupId = this.getGroupIdByCharacteristics(column);

				if (!charactGroupId) {
					charactGroupId = groupId;
				} else if (charactGroupId !== groupId) {
					this.addError(field, 'diffGroups', this.__('Attributes cannot be from multiple Product Types.'));
					return;
				}
			}
		}

		if (hasCharact && hasCommodityGroup) {
			this.addError(field, 'charactAndGroupSpecified', this.__('Product type and Attributes can\'t be specified at the same time.'));
			return;
		}
	}

	getGroupIdByCharacteristics(charactKey) {
		for (let groupId in this.characteristicsByGroup) {
			const props = this.characteristicsByGroup[groupId];
			if (charactKey in props.characts) {
				return groupId;
			}
		}

		return false;
	}

	async validateMappingSet(value, options, field) {
		const requiredError = this.__('For import you should map at least one column.');

		if (!_.isArray(value)) {
			this.addError(field, 'required', requiredError);
			return;
		}

		options = null;
		const mappedFields = {};

		try {
			const val = await this.getOptions('mappingColumns');
			options = val;

			let mappingExists = false;
			for (let itemVal of Array.from(value)) {
				if (itemVal !== '') {
					mappingExists = true;

					if (mappedFields[itemVal] && (itemVal !== 'image')) {
						this.addError(field, 'repeatedValue', this.__('Field \'%s\' should not be repeated.', [this.getColumnTitleByKey(options, itemVal)]));
						throw 'hasErrors';
					} else {
						mappedFields[itemVal] = true;
					}
				}
			}

			if (!mappingExists) {
				this.addError(field, 'required', requiredError);
				throw 'hasErrors';
			}
		} catch (e) {
			if (e === 'hasErrors') {
				return;
			} else {
				throw e;
			}
		}
	}

	getColumnTitleByKey(options, searchingKey) {
		for (let option of Array.from(options)) {
			if (searchingKey === option[0]) {
				return option[1];
			}
		}

		return null;
	}

	validateOnlyUpdate(value, options, field, attributes) {
		if (this.hasErrors('mapping')) {
			return;
		}

		if (value === '1') {
			let skuExists = false;
			for (let fieldName of Array.from(attributes.mapping)) {
				if (fieldName === 'sku') {
					skuExists = true;
					break;
				}
			}

			if (!skuExists) {
				this.addError(field, 'noSku', this.__('For update you should map sku.'));
				return;
			}
		}
	}

	validateFirstRows(value, options, field) {
		if (this.hasErrors('skip_first_rows')) {
			return;
		}

		if (value === '') {
			return;
		}

		if (!/^\d+$/.test(value)) {
			this.addError(field, 'onlyNum', this.__('String should contain only numbers.'));
			return;
		}

		value = value * 1;
		if (isNaN(value)) {
			this.addError(field, 'onlyNum', this.__('String should contain only numbers.'));
			return;
		}

		if (value < 1) {
			this.addError(field, 'onlyPositive', this.__('Value should be greater than %s', [0]));
			return;
		}
	}

	validateDetectVariants(value, options, field) {
		//@ts-ignore
		const {mapping, detect_variants_by} = this.attributes;
		if (!value || this.hasErrors('mapping') || this.hasErrors('detect_variants_by') || !Array.isArray(mapping)) {
			return;
		}

		let hasCharact = false;
		let requiredField = false;

		for (let i = 0; i < mapping.length; i++) {
			const column = mapping[i];
			if (column === detect_variants_by) {
				requiredField = true;
			} else if (charactRegExp.test(column)) {
				hasCharact = true;
			}
		}

		if (!requiredField) {
			this.addError(field, 'noSku', this.__('Mapping for \'%s\' must be specified', [detect_variants_by]));
			return;
		}

		if (!hasCharact) {
			this.addError(field, 'noCharact', this.__('Mapping for characteristics with multiple values must be specified.'));
			return;
		}
	}
}