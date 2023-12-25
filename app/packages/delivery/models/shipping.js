import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Shipping extends ExtendedModel {
		static async findByAlias(alias, langId) {
			const rows = await this.sequelize.sql(`
				select
					*
				from
					shipping
					inner join shipping_text using(shipping_id)
				where
					alias = :alias
					and lang_id = :lang
			`, {
				alias,
				lang: langId
			});

			if (!rows.length) {
				throw new Error(`Cannot find shipping with alias = '${alias}'`);
			}

			return rows[0];
		}

		//If onlyNew - find only shipping, which were not added to `delivery` (instance table)
		static async findOptions(langId, out = [], key = 'shipping_id', onlyNew = false, excludeAliases = []) {
			let where = '';
			if (onlyNew) {
				where += `
					and shipping_id not in (
						select
							distinct shipping_id
						from
							delivery
						where
							shipping_id is not null
							and deleted_at is null
					)
				`;
			}

			if (Array.isArray(excludeAliases) && excludeAliases.length > 0) {
				where += `and alias not in (${this.sequelize.escapeIn(excludeAliases)})`;
			}

			const rows = await this.sequelize.sql(`
				select
					shipping_id,
					alias,
					title
				from
					shipping
					inner join shipping_text using(shipping_id)
				where
					lang_id = :lang
					and only_calculation is false
				${where}
				order by title asc
			`, {
				lang: langId
			});

			for (const row of rows) {
				//@ts-ignore
				out.push([row[key], row.title]);
			}

			return out;
		}
	}

	Shipping.init({
		shipping_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.STRING(20)
		},

		settings: {
			type: DataTypes.JSONB
		},

		only_calculation: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'shipping',
		modelName: 'shipping',
		sequelize
	});

	return Shipping;
}