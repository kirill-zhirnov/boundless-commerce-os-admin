import DataProvider from '../../../../modules/dataProvider/index';
import _ from 'underscore';

export default class ProductCharacteristicDataProvider extends DataProvider {
	constructor(options) {
		super(options);
		this.redefineSettings = false;
		this.redefineCharacteristics = false;
		this.splitSize = true;

		return _.extend(this, _.pick(options, [
			'redefineSettings',
			'redefineCharacteristics',
			'splitSize'
		])
		);
	}

	initialize(options) {

	}

	getRules() {
		return [
			['productId, groupId', 'required'],
			['productId, groupId', 'isNumeric'],
		];
	}

	createQuery() {
		const groupId = this.getSafeAttr('groupId');
		const productId = this.getSafeAttr('productId');

		this.q.field('vw.characteristic_id');
		this.q.field('vw.parent_id');
		this.q.field('vw.title');
		this.q.field('vw.help');
		this.q.field('vw.alias');
		this.q.field('vw.type');
		this.q.field('vw.system_type');
		this.q.field('vw.is_folder');
		this.q.field('vw.is_hidden');
		this.q.field('vw.default_value');
		this.q.field('pVal.case_id', 'value_case');
		this.q.field('pValText.value', 'value_text');
		this.q.field('cCase.case_id');
		this.q.field('caseText.title', 'case_title');

		this.q.from('vw_characteristic_grid', 'vw');
		this.q.left_join(
			'characteristic_type_case',
			'cCase',
			'cCase.characteristic_id = vw.characteristic_id'
		);
		this.q.left_join(
			'characteristic_type_case_text',
			'caseText',
			`cCase.case_id = caseText.case_id and caseText.lang_id = ${this.getDb().escape(this.getEditingLang().lang_id)}`
		);
		this.q.left_join(
			'characteristic_product_val',
			'pVal',
			`\
vw.characteristic_id = pVal.characteristic_id \
and pVal.product_id = ${this.getDb().escape(productId)} \
and (pVal.case_id = cCase.case_id or pVal.case_id is null)\
`
		);
		this.q.left_join(
			'characteristic_product_val_text',
			'pValText',
			`pVal.value_id = pValText.value_id and pValText.lang_id = ${this.getDb().escape(this.getEditingLang().lang_id)}`
		);

		this.q.where('vw.lang_id = ?', this.getEditingLang().lang_id);
		this.q.where('vw.group_id = ?', groupId);

		if (this.redefineSettings) {
			this.q.where('vw.characteristic_id not in ( \
select \
characteristic_id \
from \
product_variant_characteristic \
where \
product_id = ? \
and rel_type = \'variant\' \
)', productId);
		}

		if (this.redefineCharacteristics) {
			this.q.where('vw.characteristic_id in ( \
select \
characteristic_id \
from \
product_variant_characteristic \
where \
product_id = ? \
and rel_type = \'redefine\' \
)', productId);
		}

		this.q.order('vw.tree_sort');
		return this.q.order('cCase.sort');
	}

	//@ts-ignore
	async prepareData(rows) {
		const res = this.prepareCharacteristics(rows);

		const out = {
			productId: this.getSafeAttr('productId'),
			size: res.size,
			tree: res.tree
		};

		const group = await this.loadCommodityGroup();
		out.group = group.toJSON();

		return out;
	}

	prepareCharacteristics(rows) {
		const tree = this.makeCharacteristicsTree(rows);

		const out = {
			size: this.splitSizeCharacteristics(tree),
			tree: this.groupCharacteristics(tree)
		};

		return out;
	}

	groupCharacteristics(tree) {
		const out = [];
		let group =
			{children: []};

		tree.forEach(row => {
			if (row.is_folder) {
				if (group.children.length > 0) {
					out.push(group);
					group = {
						children: []
					};
				}
				return out.push(row);
			} else {
				return group.children.push(row);
			}
		});

		if (group.children.length > 0) {
			out.push(group);
		}

		return out;
	}

	splitSizeCharacteristics(tree) {
		const sizeIndex = tree.findIndex(row => row.system_type === 'size');

		if (sizeIndex === -1) {
			return null;
		}

		const size = tree[sizeIndex];
		tree.splice(sizeIndex, 1);

		const children = {};
		if (Array.isArray(size.children)) {
			size.children.forEach(row => children[row.system_type] = row);
		}

		size.children = children;

		return size;
	}

	makeCharacteristicsTree(rows) {
		let out = [];
		const key2Id = {};

		for (let i = 0; i < rows.length; i++) {
			var outRow, parent;
			const row = rows[i];
			if (row.characteristic_id in key2Id) {
				if (row.parent_id) {
					parent = out[key2Id[row.parent_id]];

					if (!parent) {
						throw new Error(`Parent not found: ${row.parent_id}`);
					}

					outRow = parent.children[key2Id[row.characteristic_id]];
				} else {
					outRow = out[key2Id[row.characteristic_id]];
				}
			} else {
				var addTo;
				outRow = _.omit(row, [
					'case_id', 'case_title', 'value_case', 'value_text'
				]);

				outRow.cases = [];
				outRow.value = row.type === 'checkbox' ? [] : null;

				//				switch row.system_type
				//					when 'length', 'width', 'height'
				//						outRow.title += " " + @getI18n().__('(cm.)')
				//
				//					when 'weight'
				//						outRow.title += " " + @getI18n().__('(kg.)')

				if (row.is_folder) {
					outRow.children = [];
				}

				if (row.parent_id) {
					parent = out[key2Id[row.parent_id]];

					if (!parent) {
						throw new Error(`Parent not found: ${row.parent_id}`);
					}

					addTo = parent.children;
				} else {
					addTo = out;
				}

				addTo.push(outRow);
				key2Id[row.characteristic_id] = addTo.length - 1;
			}

			if (row.case_id) {
				outRow.cases.push([row.case_id, row.case_title]);
			}

			if (row.value_case) {
				if (_.isArray(outRow.value)) {
					outRow.value.push(row.value_case);
				} else {
					outRow.value = row.value_case;
				}
			} else if (row.value_text) {
				outRow.value = row.value_text;
			}
		}

		out = this.checkValues(out);

		return out;
	}

	//	if no value - set default.
	//	need to call it after main loop - to be able to set case_id by values (because in
	//	row.default_value - text representaion of value)
	checkValues(rows) {
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if ((row.value === null) || (_.isArray(row.value) && (row.value.length === 0))) {
				rows[i].value = this.prepareDefaultValue(row);
			}

			if (row.children) {
				row.children = this.checkValues(row.children);
			}
		}

		return rows;
	}

	loadCommodityGroup() {
		//@ts-ignore
		return this.getModel('commodityGroup').findException({
			include: [{
				model: this.getModel('commodityGroupText'),
				where: {
					lang_id: this.getEditingLang().lang_id
				}
			}],
			where: {
				group_id: this.getSafeAttr('groupId')
			}
		});
	}

	getPageSize() {
		return false;
	}

	prepareDefaultValue(row) {
		return row.value;
	}

	//		Do not set default value since it is confusing!

	//		if row.type == 'checkbox'
	//			value = []
	//
	//			if row.default_value
	//				for textVal in row.default_value.split ','
	//					if caseId = @findCaseIdByText(row.cases, validator.trim(textVal))
	//						value.push caseId
	//		else if ['radio', 'select'].indexOf(row.type) != -1
	//			value = @findCaseIdByText row.cases, validator.trim(row.default_value)
	//		else
	//			value = row.default_value
	//
	//		return value

	findCaseIdByText(cases, text) {
		for (let row of Array.from(cases)) {
			if (row[1] === text) {
				return row[0];
			}
		}

		return null;
	}
}