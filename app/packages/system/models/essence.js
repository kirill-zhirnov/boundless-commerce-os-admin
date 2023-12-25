import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Essence extends ExtendedModel {
		static isEssenceExists(type, pk) {
			let tbl = null;
			let where = '';
			switch (type) {
				case 'orders':
					tbl = 'orders';
					where = 'order_id = :pk';
					break;
			}

			if (!tbl) {
				return Q.resolve(false);
			}

			const deferred = Q.defer();

			this.sequelize.sql(`\
select 1 from ${tbl} where ${where}\
`, {
				pk
			})
				.then(rows => {
					if (rows.length) {
						return deferred.resolve(true);
					} else {
						return deferred.resolve(false);
					}
				});

			return deferred.promise;
		}
	}

	Essence.init({
		essence_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		type: {
			type: DataTypes.STRING
		},

		essence_local_id: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'essence',
		modelName: 'essence',
		sequelize
	});

	return Essence;
}


// module.exports = function (sequelize, DataTypes) {
// 	return sequelize.define('essence', {
// 		essence_id: {
// 			type: DataTypes.INTEGER,
// 			primaryKey: true,
// 			autoIncrement: true
// 		},

// 		type: {
// 			type: DataTypes.STRING
// 		},

// 		essence_local_id: {
// 			type: DataTypes.INTEGER
// 		}

// 	}, {
// 		tableName: 'essence',
// 		classMethods: {
// 			isEssenceExists(type, pk) {
// 				let tbl = null;
// 				let where = '';
// 				switch (type) {
// 					case 'orders':
// 						tbl = 'orders';
// 						where = 'order_id = :pk';
// 						break;
// 				}

// 				if (!tbl) {
// 					return Q.resolve(false);
// 				}

// 				const deferred = Q.defer();

// 				this.sequelize.sql(`\
// select 1 from ${tbl} where ${where}\
// `, {
// 					pk
// 				})
// 					.then(rows => {
// 						if (rows.length) {
// 							return deferred.resolve(true);
// 						} else {
// 							return deferred.resolve(false);
// 						}
// 					}).done();

// 				return deferred.promise;
// 			}
// 		}
// 	});
// };
