import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class VariantText extends ExtendedModel {
	}

	VariantText.init({
		variant_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.STRING,
			allowNull: true
		}
	}, {
		tableName: 'variant_text',
		modelName: 'variantText',
		sequelize
	});

	return VariantText;
}