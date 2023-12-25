import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class ShippingTariff extends ExtendedModel {
		static findTariffsByAlias(alias, langId, addition) {
			if (addition == null) {addition = '';}
			const deferred = Q.defer();

			this.sequelize.sql(`\
select \
shipping_tariff.*, \
shipping_tariff_text.title \
from \
shipping_tariff \
inner join shipping_tariff_text using (tariff_id) \
inner join shipping using (shipping_id) \
where \
alias = :alias \
and lang_id = :lang \
and shipping_tariff.deleted_at is null \
${addition}\
`, {
				alias,
				lang: langId
			})
				.then(rows => {
					return deferred.resolve(rows);
				});

			return deferred.promise;
		}
	}

	ShippingTariff.init({
		tariff_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		shipping_id: {
			type: DataTypes.INTEGER
		},

		local_id: {
			type: DataTypes.STRING(20)
		},

		type: {
			type: DataTypes.STRING(20)
		},

		service_group: {
			type: DataTypes.STRING(20)
		},

		postomat: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'shipping_tariff',
		deletedAt: 'deleted_at',
		modelName: 'shippingTariff',
		sequelize
	});

	return ShippingTariff;
}