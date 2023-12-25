import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class LangTitle extends ExtendedModel {
	}

	LangTitle.init({
		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		in_lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'lang_title',
		modelName: 'langTitle',
		sequelize
	});

	return LangTitle;
}