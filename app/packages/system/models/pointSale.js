import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PointSale extends ExtendedModel {
	}

	PointSale.init({
		point_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		}

	}, {
		tableName: 'point_sale',
		modelName: 'pointSale',
		sequelize
	});

	return PointSale;
}