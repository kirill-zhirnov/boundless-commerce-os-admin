import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Characteristic extends ExtendedModel {
		static async findFolderOptions(groupId, langId) {
			const out = [];
			const rows = await this.sequelize.sql(`
				select
					characteristic_id,
					title
				from
					characteristic
					inner join characteristic_text using(characteristic_id)
					inner join characteristic_prop using(characteristic_id)
				where
					group_id = :group
					and parent_id is null
					and lang_id = :lang
					and is_folder = true
				order by
					sort
			`, {
				group: groupId,
				lang: langId
			});

			for (const row of rows) {
				//@ts-ignore
				const {characteristic_id, title} = row;

				out.push([characteristic_id, title]);
			}

			return out;
		}

		static async findCharacterOptionsByGroup(langId, charactIdPrefix = '') {
			const rows = await this.sequelize.sql(`
				select
					commodity_group.group_id,
					commodity_group_text.title as group_title,
					characteristic_id,
					vw_characteristic_grid.title as characteristic_title
				from
					commodity_group
					inner join commodity_group_text using(group_id)
					inner join vw_characteristic_grid using(group_id, lang_id)
				where
					commodity_group.deleted_at is null
					and lang_id = :lang
					and vw_characteristic_grid.is_folder is false
					and vw_characteristic_grid.is_hidden is false
				order by
					group_title asc, vw_characteristic_grid.tree_sort asc
				`, {
				lang: langId
			});

			const groups = [];
			const characteristics = {};

			for (const row of rows) {
				//@ts-ignore
				const {group_id, group_title, characteristic_id, characteristic_title} = row;
				if (!(group_id in characteristics)) {
					groups.push({
						id: group_id,
						title: group_title
					});
					characteristics[group_id] = [];
				}

				characteristics[group_id].push([`${charactIdPrefix}${characteristic_id}`, characteristic_title]);
			}

			const out = [];
			for (const group of groups) {
				out.push([group.title, characteristics[group.id]]);
			}

			return out;
		}

		static removeUnused(options = {}) {
			return this.sequelize.sql('\
delete from \
characteristic \
where \
group_id is null \
and characteristic_id not in ( \
select \
characteristic_id \
from \
characteristic_variant_val \
) \
and characteristic_id not in ( \
select \
characteristic_id \
from \
product_variant_characteristic \
)\
', {}, options);
		}

		static isTypeTextValue(type) {
			if (['text', 'textarea'].indexOf(type) !== -1) {
				return true;
			}

			return false;
		}

		static isTypeCaseValue(type) {
			if (['checkbox', 'radio', 'select'].indexOf(type) !== -1) {
				return true;
			}

			return false;
		}

		static isTypeMultipleValue(type) {
			if (['checkbox'].indexOf(type) !== -1) {
				return true;
			}

			return false;
		}

		static createCharacteristic(groupId, parentId, type, title, langId) {
			let characteristic = null;

			return Q(this.create({
				parent_id: parentId,
				group_id: groupId,
				type
			}))
				.then(row => {
					characteristic = row;

					return this.sequelize.model('characteristicText').update({
						title
					}, {
						where: {
							characteristic_id: characteristic.characteristic_id,
							lang_id: langId
						}
					});
				}).then(() => {
					return characteristic;
				});
		}

		static setTextVal(productId, characteristicId, langId, value) {
			return this.sequelize.sql('\
insert into characteristic_product_val \
(product_id, characteristic_id) \
values \
(:product, :characteristic) \
on conflict do nothing \
returning *\
', {
				product: productId,
				characteristic: characteristicId
			})
				.then(() => {
					return this.sequelize.sql('\
update \
characteristic_product_val_text \
set \
value = :textVal \
where \
value_id in ( \
select \
value_id \
from \
characteristic_product_val \
where \
product_id = :product \
and characteristic_id = :characteristic \
) \
and lang_id = :lang\
', {
						textVal: value,
						product: productId,
						characteristic: characteristicId,
						lang: langId
					});
				})
				.then(() => {
					return true;
				});
		}

		static setCaseVals(productId, characteristicId, cases, deleteOtherCases) {
			if (deleteOtherCases == null) {deleteOtherCases = true;}
			return Q()
				.then(() => {
					if (deleteOtherCases) {
						return this.sequelize.sql(`\
delete from \
characteristic_product_val \
where \
product_id = :product \
and characteristic_id = :characteristic \
and case_id not in (${this.sequelize.escapeIn(cases)})\
`, {
							product: productId,
							characteristic: characteristicId
						});
					}
				})
				.then(() => {
					const upRows = [];
					for (let caseId of Array.from(cases)) {
						upRows.push(`(${this.sequelize.escape(productId)}, ${this.sequelize.escape(characteristicId)}, ${this.sequelize.escape(caseId)})`);
					}

					if (upRows.length > 0) {
						return this.sequelize.sql(`\
insert into characteristic_product_val \
(product_id, characteristic_id, case_id) \
values \
${upRows.join(',')} \
on conflict do nothing\
`
						);
					}
				});
		}

		static createCase(characteristicId, langId, title) {
			let caseRow = null;
			return Q(this.sequelize.model('characteristicTypeCase').create({
				characteristic_id: characteristicId
			}))
				.then(row => {
					caseRow = row;

					return this.sequelize.model('characteristicTypeCaseText').update({
						title
					}, {
						where: {
							case_id: caseRow.case_id,
							lang_id: langId
						}
					});
				}).then(() => {
					return caseRow;
				});
		}

		static async findOrCreateCase(characteristicId, langId, caseTitle) {
			let caseId = null;

			const rows = await this.sequelize.sql(`
				select
					case_id
				from
					characteristic_type_case
					inner join characteristic_type_case_text using(case_id)
				where
					characteristic_id = :characteristic
					and lang_id = :lang
					and title = :title
			`, {
				characteristic: characteristicId,
				lang: langId,
				title: caseTitle
			});

			if (rows[0]) {
				//@ts-ignore
				caseId = rows[0].case_id;
			} else {
				const newCase = await this.sequelize.model('characteristicTypeCase').create({characteristic_id: characteristicId});
				caseId = newCase.case_id;
			}

			await this.sequelize.model('characteristicTypeCaseText').update({
				title: caseTitle
			}, {
				where: {
					case_id: caseId,
					lang_id: langId
				}
			});

			return caseId;
		}

		static isSysTypeDimensionsRelated(systemType) {
			if (['length', 'width', 'height', 'weight'].indexOf(systemType) !== -1) {
				return true;
			}

			return false;
		}

		static resetProductVals(productId) {
			return this.sequelize.sql('\
delete from characteristic_product_val \
where \
product_id = :product\
', {
				product: productId
			});
		}

		isCaseValue() {
			//@ts-ignore
			return this.constructor.isTypeCaseValue(this.type);
		}

		isMultiValue() {
			//@ts-ignore
			return this.constructor.isTypeMultipleValue(this.type);
		}

		isTypeTextValue() {
			//@ts-ignore
			return this.constructor.isTypeTextValue(this.type);
		}

		isDimensionsRelated() {
			//@ts-ignore
			return this.constructor.isSysTypeDimensionsRelated(this.system_type);
		}
	}

	Characteristic.init({
		characteristic_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		parent_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		group_id: {
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.ENUM('checkbox', 'radio', 'select', 'text', 'textarea'),
			allowNull: true
		},

		system_type: {
			type: DataTypes.ENUM('length', 'width', 'height', 'weight'),
			allowNull: true
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'characteristic',
		modelName: 'characteristic',
		sequelize
	});

	return Characteristic;
}