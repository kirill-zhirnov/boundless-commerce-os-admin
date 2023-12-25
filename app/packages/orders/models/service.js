import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Service extends ExtendedModel {
		static findDelivery() {
			return this.findByAlias('delivery');
		}

		static findByAlias(alias) {
			const deferred = Q.defer();

			Q(this.findOne({
				where: {
					alias: 'delivery'
				}
			}))
				.then(function (row) {
					if (!row) {
						throw new Error(`Service '${alias}' not found!`);
					}

					return deferred.resolve(row);
				}).done();

			return deferred.promise;
		}
	}

	Service.init({
		service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT
		},

		price: {
			type: DataTypes.DECIMAL(20, 2)
		},

		show_in_list: {
			type: DataTypes.BOOLEAN
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'service',
		deletedAt: 'deleted_at',
		modelName: 'service',
		sequelize
	});

	return Service;
}