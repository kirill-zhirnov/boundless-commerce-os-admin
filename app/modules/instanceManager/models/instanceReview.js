import ExtendedModel from '../../db/model';

export default function (sequelize, DataTypes) {
	class InstanceReview extends ExtendedModel {

	}

	InstanceReview.init({
		instance_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},

		review_left_at: {
			type: DataTypes.DATE
		},

		token_1: {
			type: DataTypes.STRING(50),
		},

		token_2: {
			type: DataTypes.STRING(10),
		},

		created_at: {
			type: DataTypes.DATE
		},
	}, {
		tableName: 'instance_review',
		modelName: 'instanceReview',
		sequelize
	});

	return InstanceReview;
}