import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class ShippingCity extends ExtendedModel {
		static addType(shippingId, cityId, types) {
			return Q(this.findOne({
				where: {
					shipping_id: shippingId,
					city_id: cityId
				}
			})).then(row => {
				if (!row) {
					return Q.reject(new Error('Shipping city not found!'));
				}

				types.forEach(function (type) {
					if (!row.type.includes(type)) {
						return row.type.push(type);
					}
				});

				return row.save();
			});
		}

		static setType(shippingId, cityId, types) {
			return Q(this.sequelize.sql(`\
update shipping_city \
set \
type = '{${types.join(',')}}' \
where \
shipping_id = :shipping \
and city_id = :city\
`, {
				shipping: shippingId,
				city: cityId
			}));
		}
	}

	ShippingCity.init({
		shipping_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		city_id: {
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.ARRAY(DataTypes.ENUM('courier', 'self-pick-up'))
		},

		local_id: {
			type: DataTypes.STRING(255)
		},

		local_city_title: {
			type: DataTypes.STRING(255),
			allowNull: true
		}
	}, {
		tableName: 'shipping_city',
		modelName: 'shippingCity',
		sequelize
	});

	return ShippingCity;
}