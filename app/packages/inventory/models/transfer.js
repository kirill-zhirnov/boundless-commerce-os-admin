import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Transfer extends ExtendedModel {
		static getStatusOptions(i18n, out) {
			if (out == null) {out = [];}
			return out.concat([
				['draft', i18n.p__('transfer', 'Draft')],
				['completed', i18n.p__('transfer', 'Completed')],
				['cancelled', i18n.p__('transfer', 'Cancelled')]
			]);
		}
	}

	Transfer.init({
		transfer_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		status: {
			type: DataTypes.ENUM('draft', 'completed', 'cancelled'),
			allowNull: true
		},

		from_location_id: {
			type: DataTypes.INTEGER
		},

		to_location_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		completed_movement_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		cancelled_movement_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		movement_comment: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'transfer',
		modelName: 'transfer',
		sequelize
	});

	return Transfer;
}