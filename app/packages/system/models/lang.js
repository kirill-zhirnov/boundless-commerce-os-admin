import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Lang extends ExtendedModel {
	}

	Lang.init({
		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		code: {
			type: DataTypes.STRING
		},

		is_backend: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'lang',
		modelName: 'lang',
		sequelize
	});

	return Lang;
}