import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CustomerGroup extends ExtendedModel {
		static findOptions(langId, out = []) {
			return this.sequelize.sql('\
select \
group_id, \
title \
from \
customer_group \
inner join customer_group_text using(group_id) \
where \
lang_id = :lang \
and deleted_at is null\
', {
				lang: langId
			})
				.then(function (rows) {
					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.group_id, row.title]);
					}

					return out;
				});
		}

		static fineOneByAlias(alias) {
			return this.findOne({
				where: {
					alias,
					deleted_at: null
				}
			});
		}
	}

	CustomerGroup.init({
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		price_id: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'customer_group',
		deletedAt: 'deleted_at',
		modelName: 'customerGroup',
		sequelize
	});

	return CustomerGroup;
}