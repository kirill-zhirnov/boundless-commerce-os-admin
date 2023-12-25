import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class InventoryMovement extends ExtendedModel {
		//			Resolve promise with TRUE if inventoryMovement was destroyed, FALSE on other case
		static destroyIfEmpty(movementId, trx = null) {
			let out = false;

			return Q(this.sequelize.model('inventoryMovementItem').count({
				where: {
					movement_id: movementId
				},
				transaction: trx
			}))
				.then(result => {
					if (result === 0) {
						out = true;
						return this.sequelize.model('inventoryMovement').destroy({
							where: {
								movement_id: movementId
							},
							transaction: trx
						});
					}
				})
				.then(() => {
					return out;
				});
		}

		static async createByReason(reasonCategory, reasonAlias, personId, reserveId = null, props = null, notes = null, trx = null, orderId = null) {
			const [row] = await this.sequelize.sql('\
		insert into inventory_movement \
		(reason_id, person_id, reserve_id, props, notes, order_id) \
		select \
		option_id, \
		:personId, \
		:reserveId, \
		:props, \
		:notes, \
		:orderId \
		from \
		inventory_option \
		where \
		category = :category \
		and alias = :alias \
		returning *\
		', {
				personId,
				reserveId,
				props: props ? JSON.stringify(props) : null,
				notes,
				category: reasonCategory,
				alias: reasonAlias,
				orderId
			}, {
				transaction: trx
			});

			return row;
		}

		static getLastMovement() {
			const deferred = Q.defer();

			this.sequelize.sql('\
		select max(ts) as max from inventory_movement\
		').then(rows => {
				//@ts-ignore
				return deferred.resolve(rows[0].max);
			});

			return deferred.promise;
		}
	}

	InventoryMovement.init({
		movement_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		reason_id: {
			type: DataTypes.INTEGER
		},

		person_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		reserve_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		order_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		props: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		notes: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		ts: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'inventory_movement',
		modelName: 'inventoryMovement',
		sequelize
	});

	return InventoryMovement;
}