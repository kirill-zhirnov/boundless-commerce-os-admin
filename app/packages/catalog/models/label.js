import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Label extends ExtendedModel {
		static loadLabel(labelId, langId) {
			let id = parseInt(labelId);
			id = isNaN(id) ? 0 : id;

			return this.sequelize.sql('\
select \
* \
from \
label \
inner join label_text using(label_id) \
where \
label_id = :id \
and deleted_at is null \
and lang_id = :lang\
', {
				id,
				lang: langId
			})
				.then(rows => rows[0]);
		}

		static async findOptions(langId, out = []) {
			const rows = await this.findAll({
				include: [{
					model: this.sequelize.model('labelText'),
					where: {
						lang_id: langId
					}
				}],
				where: {
					deleted_at: null
				},
				order: [
					[this.sequelize.model('labelText'), 'title', 'ASC']
				]
			});

			for (let row of rows) {
				//@ts-ignore
				row = row.toJSON();

				// color, color_text and icon is needed to display label in product edit form
				//@ts-ignore
				out.push([row.label_id, row.labelTexts[0].title, row.color, row.icon, row.text_color]);
			}

			return out;
		}

		static async findLabelsByProducts(productIds, langId) {
			if (productIds.length === 0) {
				return [];
			}

			const query = '\
select \
pl.product_id, \
l.label_id, \
l.color, \
l.text_color, \
l.icon, \
lt.title \
from \
label l \
inner join label_text lt on l.label_id = lt.label_id \
inner join product_label_rel pl on l.label_id = pl.label_id \
where \
lt.lang_id = :langId \
and pl.product_id in (:productIds) \
and l.deleted_at is null\
';

			const labels = await this.sequelize.sql(query, {langId, productIds});

			const out = {};
			for (const label of labels) {
				//@ts-ignore
				const {product_id} = label;
				if (out[product_id] != null) {
					out[product_id].push(label);
				} else {
					out[product_id] = [label];
				}
			}

			return out;
		}
	}

	Label.init({
		label_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		color: {
			type: DataTypes.TEXT
		},

		text_color: {
			type: DataTypes.TEXT
		},

		icon: {
			type: DataTypes.INTEGER
		},

		remove_after: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		tableName: 'label',
		deletedAt: 'deleted_at',
		modelName: 'label',
		sequelize
	});

	return Label;
}