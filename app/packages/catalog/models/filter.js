import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Filter extends ExtendedModel {
		static async loadOptions(out) {
			if (out == null) {out = [];}
			const rows = await this.sequelize.sql(`
				select
					filter_id,
					title
				from
					filter
				order by
					title
			`);

			for (const row of Array.from(rows)) {
				//@ts-ignore
				out.push([row.filter_id, row.title]);
			}

			return out;
		}

		static async createDefaultFilter(i18n) {
			await this.sequelize.sql(`
				insert into filter
					(title, is_default)
				values
					(:title, true)
				on conflict do nothing
			`, {
				title: i18n.__('Filter by default')
			});

			const filter = await this.sequelize.model('filter').findOne({
				where: {is_default: true}
			});
			await this.createDefaultFilterFields(filter);

			return filter;
		}

		static async createDefaultFilterFields(filter) {
			// await this.sequelize.sql(`
			// 	insert into filter_field
			// 		(filter_id, type)
			// 	values
			// 		(:filterId, 'category')
			// 	on conflict do nothing
			// `, {
			// 	filterId: filter.filter_id
			// });

			await this.sequelize.sql(`
				insert into filter_field
					(filter_id, type)
				values
					(:filterId, 'price')
				on conflict do nothing
			`, {
				filterId: filter.filter_id
			});
		}

		static async checkDefaultExists() {
			const rows = await this.sequelize.sql('select 1 from filter where is_default is true');

			if (!rows.length) {
				await this.sequelize.sql(`
					update
						filter
					set
						is_default = true
					where
						filter_id in (select filter_id from filter limit 1)
				`);
			}
		}
	}

	Filter.init({
		filter_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING(255)
		},

		is_default: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'filter',
		modelName: 'filter',
		sequelize
	});

	return Filter;
}