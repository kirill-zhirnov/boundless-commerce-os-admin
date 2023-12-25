import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class AuthRule extends ExtendedModel {
	}

	AuthRule.init({
		rule_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		role_id: {
			type: DataTypes.INTEGER
		},

		resource_id: {
			type: DataTypes.INTEGER
		},

		task_id: {
			type: DataTypes.INTEGER
		},

		is_allowed: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'auth_rule',
		modelName: 'authRule',
		sequelize
	});

	return AuthRule;
}