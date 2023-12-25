import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class CustomerGroupText extends ExtendedModel {
	}

	CustomerGroupText.init({
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		title: {
			type: DataTypes.TEXT
		}
	}, {
		tableName: 'customer_group_text',
		modelName: 'customerGroupText',
		sequelize
	});

	return CustomerGroupText;
}