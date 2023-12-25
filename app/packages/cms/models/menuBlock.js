import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class MenuBlock extends ExtendedModel {
	}

	MenuBlock.init({
		block_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		key: {
			type: DataTypes.STRING(100)
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'menu_block',
		modelName: 'menuBlock',
		sequelize
	});

	return MenuBlock;
}