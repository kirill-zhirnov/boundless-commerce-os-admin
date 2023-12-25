import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class UnitMeasurement extends ExtendedModel {
	}

	UnitMeasurement.init({
		unit_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'unit_measurement',
		scopes: {
			byTitleAsc: {
				order: [['title', 'asc']]
			}
		},
		//@ts-ignore
		optionsSettings: {
			key: 'unit_id',
			title: 'title',
			scopes: ['byTitleAsc']
		},

		modelName: 'unitMeasurement',
		sequelize
	});

	return UnitMeasurement;
}