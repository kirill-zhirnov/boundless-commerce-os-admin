import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class TypeareaBlockText extends ExtendedModel {
	}

	TypeareaBlockText.init({
		block_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		value: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'typearea_block_text',
		modelName: 'typeareaBlockText',
		sequelize
	});

	return TypeareaBlockText;
}