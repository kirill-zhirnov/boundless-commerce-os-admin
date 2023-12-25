import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class TypeareaBlock extends ExtendedModel {
	}

	TypeareaBlock.init({
		block_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		typearea_id: {
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.ENUM('text')
		},

		noindex: {
			type: DataTypes.BOOLEAN
		},

		sort: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'typearea_block',
		deletedAt: 'deleted_at',
		modelName: 'typeareaBlock',
		sequelize
	});

	return TypeareaBlock;
}