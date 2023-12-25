import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class EdostRegion extends ExtendedModel {
	}

	EdostRegion.init({
		edost_region_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		region_id: {
			type: DataTypes.INTEGER
		},

		title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'edost_region',
		modelName: 'edostRegion',
		sequelize
	});

	return EdostRegion;
}