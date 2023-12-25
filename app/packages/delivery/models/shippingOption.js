import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class ShippingOption extends ExtendedModel {
		static findOptions(shippingAlias, langId, type) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
option_id, \
shipping_option.alias, \
title \
from \
shipping_option \
inner join shipping_option_text using (option_id) \
inner join shipping using (shipping_id) \
where \
shipping_option_text.lang_id = :langId \
and shipping.alias = :alias \
and shipping_option.type::text = :type \
and shipping_option.deleted_at is null\
', {
				langId,
				alias: shippingAlias,
				type
			})
				.then(rows => {
					const out = [];

					for (let row of Array.from(rows)) {
						//@ts-ignore
						out.push([row.option_id, row.title, row.alias]);
					}

					return deferred.resolve(out);
				});

			return deferred.promise;
		}

		static getEdostCustomPickupOptions(i18n, out) {
			if (out == null) {out = [];}
			return out.concat([
				[35, i18n.__('Tariff 1')],
				[56, i18n.__('Tariff 2')],
				[57, i18n.__('Tariff 3')],
				[58, i18n.__('Tariff 4')]
			]);
		}

		static getEdostCustomCourierOptions(i18n, out) {
			if (out == null) {out = [];}
			return out.concat([
				[31, i18n.__('Tariff 1')],
				[32, i18n.__('Tariff 2')],
				[33, i18n.__('Tariff 3')],
				[34, i18n.__('Tariff 4')]
			]);
		}
	}

	ShippingOption.init({
		option_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		shipping_id: {
			type: DataTypes.INTEGER
		},

		alias: {
			type: DataTypes.STRING(20)
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'shipping_option',
		deletedAt: 'deleted_at',
		modelName: 'shippingOption',
		sequelize
	});

	return ShippingOption;
}