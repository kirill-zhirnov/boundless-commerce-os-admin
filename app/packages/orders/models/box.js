import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Box extends ExtendedModel {
	}

	Box.init({
		box_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		length: {
			type: DataTypes.DECIMAL(10, 2)
		},

		width: {
			type: DataTypes.DECIMAL(10, 2)
		},

		height: {
			type: DataTypes.DECIMAL(10, 2)
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'box',
		deletedAt: 'deleted_at',
		modelName: 'box',
		sequelize
	});

	return Box;
}