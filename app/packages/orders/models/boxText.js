import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class BoxText extends ExtendedModel {
	}

	BoxText.init({
		box_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'box_text',
		modelName: 'boxText',
		sequelize
	});

	return BoxText;
}