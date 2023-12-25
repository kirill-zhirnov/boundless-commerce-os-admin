import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Price extends ExtendedModel {
		static findOptions(langId, out) {
			if (out == null) {out = [];}
			return Q(this.findAll({
				include: [{
					model: sequelize.model('priceText'),
					where: {
						lang_id: langId
					}
				}],
				where: {
					deleted_at: null
				},
				order: [
					['sort', 'ASC']
				]
			}))
				.then(function (rows) {
					for (let row of Array.from(rows)) {
						row = row.toJSON();

						out.push([row.price_id, row.priceTexts[0].title]);
					}

					return out;
				});
		}

		static findAllOptions(langId, i18n, out) {
			if (out == null) {out = [];}
			return this.sequelize.sql('\
select \
price_id, \
title, \
has_old_price \
from \
price \
inner join price_text using(price_id) \
where \
deleted_at is null \
order by \
sort asc\
').then(rows => {
				for (let row of Array.from(rows)) {
					//@ts-ignore
					const {price_id, title, has_old_price} = row;
					out.push([price_id, title]);

					if (has_old_price) {
						out.push([`${price_id}_old`, `${i18n.__('Compare-at price')} (${title})`]);
					}
				}

				return out;
			});
		}

		static loadAllPrices(langId) {
			return this.sequelize.sql('\
select \
p.price_id, \
p.alias, \
p.has_old_price, \
pt.title \
from \
price p \
inner join price_text pt on \
p.price_id = pt.price_id \
and pt.lang_id = :lang \
where \
p.deleted_at is null \
order by \
p.sort asc\
', {
				lang: langId
			})
				.then(rows => {
					return rows;
				});
		}
	}

	Price.init({
		price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT
		},

		has_old_price: {
			type: DataTypes.BOOLEAN
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'price',
		deletedAt: 'deleted_at',
		modelName: 'price',
		sequelize
	});

	return Price;
}